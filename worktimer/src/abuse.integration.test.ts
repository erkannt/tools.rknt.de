// @vitest-environment node
//
// Abuse-prevention guardrails on the sync server: mandatory origin, room cap,
// per-message size cap, and per-document size cap. Uses raw `ws` clients where
// header/rejection control is needed, and y-websocket providers (with an
// Origin-injecting polyfill) for the document-size case.

import { describe, it, expect, afterEach } from 'vitest'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { WebSocket } from 'ws'
import { createServer, type SyncServer } from '../server/server'

const TEST_ORIGIN = 'http://localhost'

class OriginWebSocket extends WebSocket {
  constructor(address: string, protocols?: string | string[]) {
    super(address, protocols, { origin: TEST_ORIGIN })
  }
}

let server: SyncServer | null = null
const sockets: WebSocket[] = []
const providers: WebsocketProvider[] = []
const docs: Y.Doc[] = []

afterEach(async () => {
  sockets.forEach(s => {
    try {
      s.close()
    } catch {
      /* already closed */
    }
  })
  sockets.length = 0
  providers.forEach(p => p.destroy())
  providers.length = 0
  docs.forEach(d => d.destroy())
  docs.length = 0
  if (server) {
    await server.close()
    server = null
  }
})

/** Open a raw websocket; resolve 'open' if it connects, 'rejected' otherwise. */
function rawConnect(
  url: string,
  room: string,
  opts: { origin?: string } = {},
): Promise<'open' | 'rejected'> {
  return new Promise(resolve => {
    const ws = new WebSocket(`${url}/${room}`, opts.origin ? { origin: opts.origin } : {})
    sockets.push(ws)
    ws.on('open', () => resolve('open'))
    ws.on('error', () => resolve('rejected'))
    ws.on('unexpected-response', () => resolve('rejected'))
  })
}

function connectProvider(url: string, room: string) {
  const doc = new Y.Doc()
  docs.push(doc)
  const provider = new WebsocketProvider(url, room, doc, {
    WebSocketPolyfill: OriginWebSocket as unknown as typeof globalThis.WebSocket,
    connect: true,
    // Sync strictly through the server, not the same-process BroadcastChannel.
    disableBc: true,
  })
  providers.push(provider)
  return { doc, provider, events: doc.getMap('events') }
}

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('timed out')
    await new Promise(r => setTimeout(r, 20))
  }
}

describe('mandatory origin', () => {
  it('throws when constructed without any allowed origin', () => {
    expect(() => createServer({ port: 0, allowedOrigins: [] })).toThrow()
  })

  it('accepts a permitted origin and rejects others, including missing', async () => {
    server = await createServer({ port: 0, allowedOrigins: ['https://good'] })
    expect(await rawConnect(server.url, 'r', { origin: 'https://good' })).toBe('open')
    expect(await rawConnect(server.url, 'r', { origin: 'https://bad' })).toBe('rejected')
    expect(await rawConnect(server.url, 'r')).toBe('rejected')
  })
})

describe('max rooms', () => {
  it('rejects a new room beyond the cap but allows existing ones', async () => {
    server = await createServer({ port: 0, allowedOrigins: [TEST_ORIGIN], maxRooms: 1 })
    expect(await rawConnect(server.url, 'room-a', { origin: TEST_ORIGIN })).toBe('open')
    // A brand-new second room is refused.
    expect(await rawConnect(server.url, 'room-b', { origin: TEST_ORIGIN })).toBe('rejected')
    // A second client to the already-live room is still fine.
    expect(await rawConnect(server.url, 'room-a', { origin: TEST_ORIGIN })).toBe('open')
  })
})

describe('max message size', () => {
  it('closes a connection that sends an oversized frame', async () => {
    server = await createServer({
      port: 0,
      allowedOrigins: [TEST_ORIGIN],
      maxMessageBytes: 100,
    })
    const code = await new Promise<number>(resolve => {
      const ws = new WebSocket(`${server!.url}/room`, { origin: TEST_ORIGIN })
      sockets.push(ws)
      ws.on('open', () => ws.send(Buffer.alloc(200)))
      ws.on('close', c => resolve(c))
    })
    expect(code).toBe(1009) // message too big
  })
})

describe('max document size', () => {
  it('drops the writer and does not propagate an oversized doc', async () => {
    server = await createServer({
      port: 0,
      allowedOrigins: [TEST_ORIGIN],
      maxDocBytes: 2000,
    })
    const a = connectProvider(server.url, 'room-big')
    const b = connectProvider(server.url, 'room-big')

    // Establish a baseline sync first.
    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1 })
    await waitFor(() => b.events.has('e1'))

    // Now write an event far larger than the cap.
    a.events.set('big', { type: 'Blob', id: 'big', at: 2, blob: 'x'.repeat(5000) })

    await waitFor(() => a.provider.wsconnected === false)
    a.provider.disconnect() // stop reconnect attempts for a clean assertion

    await new Promise(r => setTimeout(r, 300))
    expect(b.events.has('big')).toBe(false)
    expect(b.events.has('e1')).toBe(true)
  })
})
