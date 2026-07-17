// @vitest-environment node
//
// The sync indicator must not overstate: "connected" is only truthful once
// the initial sync handshake has completed and this device actually holds the
// server's state. y-websocket's raw 'status' event fires "connected" at
// socket-open, before any state has been exchanged — providerStatus() (used
// by the store for the UI dot) additionally requires provider.synced.

import { describe, it, expect, afterEach } from 'vitest'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { WebSocket } from 'ws'
import { createServer, type SyncServer } from '../server/server'
import { providerStatus, type SyncStatus } from './store'

type WorkEvent = { type: string; id: string; at: number }

const TEST_ORIGIN = 'http://localhost'
class OriginWebSocket extends WebSocket {
  constructor(address: string, protocols?: string | string[]) {
    super(address, protocols, { origin: TEST_ORIGIN })
  }
}

let server: SyncServer | null = null
const providers: WebsocketProvider[] = []
const docs: Y.Doc[] = []

afterEach(async () => {
  providers.forEach(p => p.destroy())
  providers.length = 0
  docs.forEach(d => d.destroy())
  docs.length = 0
  if (server) {
    await server.close()
    server = null
  }
})

function connect(url: string, room: string) {
  const doc = new Y.Doc()
  docs.push(doc)
  const provider = new WebsocketProvider(url, room, doc, {
    WebSocketPolyfill: OriginWebSocket as unknown as typeof globalThis.WebSocket,
    connect: true,
    disableBc: true,
  })
  providers.push(provider)
  return { doc, provider, events: doc.getMap<WorkEvent>('events') }
}

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('timed out waiting for condition')
    await new Promise(r => setTimeout(r, 20))
  }
}

describe('sync status truthfulness', () => {
  it('reports connected only once the server state has actually arrived', async () => {
    server = await createServer({ port: 0, allowedOrigins: [TEST_ORIGIN] })
    const room = 'status-room'

    // Seed the room with existing state a joining device must receive.
    const a = connect(server.url, room)
    await waitFor(() => a.provider.wsconnected)
    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    await new Promise(r => setTimeout(r, 100))

    // A second device joins; sample the mapped status at every event the
    // store wires up ('status' and 'sync'), together with whether the
    // server's data has arrived yet.
    const b = connect(server.url, room)
    const samples: Array<{ status: SyncStatus; raw: string; hasData: boolean }> = []
    const sample = (raw: string) =>
      samples.push({ status: providerStatus(b.provider), raw, hasData: b.events.has('e1') })
    b.provider.on('status', (e: { status: string }) => sample(e.status))
    b.provider.on('sync', (synced: boolean) => sample(`sync:${synced}`))

    await waitFor(() => providerStatus(b.provider) === 'connected' && b.events.has('e1'))

    // The raw socket-open event fires before any state has been exchanged —
    // the old mapping would have shown "connected" here, with no data yet.
    const socketOpen = samples.find(s => s.raw === 'connected')
    expect(socketOpen).toBeDefined()
    expect(socketOpen!.hasData).toBe(false)
    expect(socketOpen!.status).toBe('connecting')

    // The mapped status never says "connected" without the server's data.
    for (const s of samples) {
      if (s.status === 'connected') expect(s.hasData).toBe(true)
    }
    expect(samples.some(s => s.status === 'connected')).toBe(true)
  })

  it('drops back to connecting when the connection is lost', async () => {
    server = await createServer({ port: 0, allowedOrigins: [TEST_ORIGIN] })
    const b = connect(server.url, 'drop-room')
    await waitFor(() => providerStatus(b.provider) === 'connected')

    await server.close()
    server = null

    await waitFor(() => providerStatus(b.provider) === 'connecting')
    expect(b.provider.synced).toBe(false)
  })
})
