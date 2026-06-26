// Minimal in-memory Yjs websocket sync server.
//
// Adapted from the canonical y-websocket server utility, trimmed to the pieces
// worktimer needs: per-room shared docs, the sync + awareness protocols, and
// connection keepalive. Documents live only in memory for as long as the
// process runs and at least one client holds them — there is no persistence
// layer (see the plan; durable storage is a later add via y-protocols hooks).

import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { WebSocketServer, WebSocket } from 'ws'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1
const PING_TIMEOUT_MS = 30_000

/** A Y.Doc shared across all connections subscribed to one room. */
class SharedDoc extends Y.Doc {
  readonly name: string
  readonly awareness: awarenessProtocol.Awareness
  /** conn -> set of awareness client ids controlled by that conn. */
  readonly conns = new Map<WebSocket, Set<number>>()

  readonly maxDocBytes: number

  constructor(name: string, maxDocBytes: number) {
    super({ gc: true })
    this.name = name
    this.maxDocBytes = maxDocBytes
    this.awareness = new awarenessProtocol.Awareness(this)
    this.awareness.setLocalState(null)

    this.awareness.on(
      'update',
      ({ added, updated, removed }: AwarenessChange, origin: unknown) => {
        const changed = added.concat(updated, removed)
        if (origin instanceof WebSocket) {
          const controlled = this.conns.get(origin)
          if (controlled) {
            for (const id of added) controlled.add(id)
            for (const id of removed) controlled.delete(id)
          }
        }
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed),
        )
        broadcast(this, encoding.toUint8Array(encoder))
      },
    )

    this.on('update', (update: Uint8Array, origin: unknown) => {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      syncProtocol.writeUpdate(encoder, update)
      broadcast(this, encoding.toUint8Array(encoder), origin)
    })
  }
}

type AwarenessChange = { added: number[]; updated: number[]; removed: number[] }

function broadcast(doc: SharedDoc, message: Uint8Array, exclude?: unknown): void {
  for (const conn of doc.conns.keys()) {
    if (conn === exclude) continue
    send(doc, conn, message)
  }
}

function send(doc: SharedDoc, conn: WebSocket, message: Uint8Array): void {
  if (conn.readyState !== WebSocket.CONNECTING && conn.readyState !== WebSocket.OPEN) {
    closeConn(doc, conn)
    return
  }
  try {
    conn.send(message, err => {
      if (err) closeConn(doc, conn)
    })
  } catch {
    closeConn(doc, conn)
  }
}

function closeConn(doc: SharedDoc, conn: WebSocket): void {
  const controlled = doc.conns.get(conn)
  if (controlled) {
    doc.conns.delete(conn)
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlled), null)
    // Drop the doc once the last client disconnects (in-memory, ephemeral).
    if (doc.conns.size === 0) doc.destroy()
  }
  try {
    conn.close()
  } catch {
    /* already closed */
  }
}

function messageListener(conn: WebSocket, doc: SharedDoc, data: Uint8Array): void {
  const encoder = encoding.createEncoder()
  const decoder = decoding.createDecoder(data)
  const messageType = decoding.readVarUint(decoder)
  switch (messageType) {
    case MESSAGE_SYNC: {
      // Reject before applying if this message could push the doc over the cap.
      // `data.length` upper-bounds the update's contribution, so the server doc
      // can never exceed the cap and an oversized doc is never stored or served.
      if (Y.encodeStateAsUpdate(doc).length + data.length > doc.maxDocBytes) {
        console.warn(`room "${doc.name}" would exceed max doc size; dropping writer`)
        closeConn(doc, conn)
        break
      }
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      syncProtocol.readSyncMessage(decoder, encoder, doc, conn)
      // Reply only if readSyncMessage produced content (e.g. a sync step).
      if (encoding.length(encoder) > 1) send(doc, conn, encoding.toUint8Array(encoder))
      break
    }
    case MESSAGE_AWARENESS: {
      awarenessProtocol.applyAwarenessUpdate(
        doc.awareness,
        decoding.readVarUint8Array(decoder),
        conn,
      )
      break
    }
  }
}

function docNameFromUrl(url: string | undefined): string {
  const path = (url ?? '/').split('?')[0]
  return decodeURIComponent(path.slice(1)) || 'default'
}

function setupConnection(
  registry: Map<string, SharedDoc>,
  limits: Limits,
  conn: WebSocket,
  req: http.IncomingMessage,
): void {
  conn.binaryType = 'arraybuffer'
  const name = docNameFromUrl(req.url)
  let doc = registry.get(name)
  if (!doc) {
    doc = new SharedDoc(name, limits.maxDocBytes)
    registry.set(name, doc)
    // Evict the empty doc from the registry when it self-destructs.
    doc.on('destroy', () => registry.delete(name))
  }
  doc.conns.set(conn, new Set())

  conn.on('message', (message: ArrayBuffer) =>
    messageListener(conn, doc!, new Uint8Array(message)),
  )

  // Keepalive: ping each connection; drop it if a pong is missed.
  let alive = true
  const pingInterval = setInterval(() => {
    if (!alive) {
      if (doc!.conns.has(conn)) closeConn(doc!, conn)
      clearInterval(pingInterval)
      return
    }
    if (doc!.conns.has(conn)) {
      alive = false
      try {
        conn.ping()
      } catch {
        closeConn(doc!, conn)
        clearInterval(pingInterval)
      }
    }
  }, PING_TIMEOUT_MS)
  conn.on('pong', () => {
    alive = true
  })
  conn.on('close', () => {
    closeConn(doc!, conn)
    clearInterval(pingInterval)
  })
  // e.g. an oversized frame trips ws's maxPayload guard; close cleanly instead
  // of letting it surface as an unhandled exception.
  conn.on('error', () => {
    closeConn(doc!, conn)
    clearInterval(pingInterval)
  })

  // Send our sync step 1 to kick off synchronisation.
  {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeSyncStep1(encoder, doc)
    send(doc, conn, encoding.toUint8Array(encoder))
  }
  // Send current awareness states, if any.
  const states = doc.awareness.getStates()
  if (states.size > 0) {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(states.keys())),
    )
    send(doc, conn, encoding.toUint8Array(encoder))
  }
}

export type SyncServer = {
  /** ws:// URL the server is listening on, including the resolved port. */
  url: string
  port: number
  /** Stop accepting connections and shut the server down. */
  close: () => Promise<void>
}

/** Resource limits, applied per connection / per room. */
type Limits = {
  maxRooms: number
  maxDocBytes: number
}

export type CreateServerOptions = {
  /**
   * Origins permitted to connect (the browser `Origin` header). Required: a
   * connection with a missing or non-matching Origin is rejected at the upgrade.
   */
  allowedOrigins: string[]
  /** Port to listen on. Use 0 for an ephemeral port (tests). */
  port?: number
  /** Host/interface to bind. Defaults to all interfaces. */
  host?: string
  /** Maximum number of distinct live rooms (default 100). */
  maxRooms?: number
  /** Maximum size of a single websocket message in bytes (default 1 MB). */
  maxMessageBytes?: number
  /** Maximum encoded size of a single room's document in bytes (default 5 MB). */
  maxDocBytes?: number
}

/**
 * Start an in-memory Yjs websocket sync server. Resolves once it is listening.
 * The same entry point is used by `make dev`, the container, and the tests.
 */
export function createServer(options: CreateServerOptions): Promise<SyncServer> {
  const {
    allowedOrigins,
    port = 1234,
    host = '0.0.0.0',
    maxRooms = 100,
    maxMessageBytes = 1_000_000,
    maxDocBytes = 5_000_000,
  } = options

  if (!allowedOrigins || allowedOrigins.length === 0) {
    throw new Error('createServer requires a non-empty allowedOrigins list')
  }
  const origins = new Set(allowedOrigins)
  const limits: Limits = { maxRooms, maxDocBytes }

  const registry = new Map<string, SharedDoc>()
  const httpServer = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('worktimer sync server\n')
  })

  const wss = new WebSocketServer({
    server: httpServer,
    maxPayload: maxMessageBytes,
    verifyClient: (info: { origin?: string; req: http.IncomingMessage }) => {
      // Mandatory origin: reject missing or non-permitted origins.
      if (!info.origin || !origins.has(info.origin)) return false
      // Room cap: reject a brand-new room once the limit is reached.
      const room = docNameFromUrl(info.req.url)
      if (!registry.has(room) && registry.size >= limits.maxRooms) return false
      return true
    },
  })
  wss.on('connection', (conn, req) => setupConnection(registry, limits, conn, req))

  return new Promise((resolve, reject) => {
    httpServer.on('error', reject)
    httpServer.listen(port, host, () => {
      const resolved = (httpServer.address() as AddressInfo).port
      resolve({
        url: `ws://${host === '0.0.0.0' ? 'localhost' : host}:${resolved}`,
        port: resolved,
        close: () =>
          new Promise<void>(res => {
            for (const conn of wss.clients) conn.terminate()
            wss.close(() => httpServer.close(() => res()))
          }),
      })
    })
  })
}
