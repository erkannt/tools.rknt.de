// @vitest-environment node
//
// End-to-end sync behaviour: a real in-memory server with two y-websocket
// clients on the wire. Exercises the worktimer events map (Y.Map keyed by
// event id) converging across devices, including last-writer-wins edits,
// deletes, room isolation, and offline -> reconnect reconciliation.

import { describe, it, expect, afterEach } from 'vitest'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { WebSocket } from 'ws'
import { createServer, type SyncServer } from '../server/server'

type WorkEvent = { type: string; id: string; at: number }

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
    WebSocketPolyfill: WebSocket as unknown as typeof globalThis.WebSocket,
    connect: true,
  })
  providers.push(provider)
  return { doc, provider, events: doc.getMap<WorkEvent>('events') }
}

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('timed out waiting for convergence')
    await new Promise(r => setTimeout(r, 20))
  }
}

describe('cross-device sync', () => {
  it('propagates a new event from one device to another', async () => {
    server = await createServer({ port: 0 })
    const a = connect(server.url, 'room-1')
    const b = connect(server.url, 'room-1')

    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })

    await waitFor(() => b.events.has('e1'))
    expect(b.events.get('e1')).toEqual({ type: 'WorkStarted', id: 'e1', at: 1000 })
  })

  it('propagates an edit (last-writer-wins on at) and a delete', async () => {
    server = await createServer({ port: 0 })
    const a = connect(server.url, 'room-2')
    const b = connect(server.url, 'room-2')

    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    await waitFor(() => b.events.has('e1'))

    // Edit on A converges on B.
    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 2500 })
    await waitFor(() => b.events.get('e1')?.at === 2500)
    expect(b.events.get('e1')?.at).toBe(2500)

    // Delete on B converges on A.
    b.events.delete('e1')
    await waitFor(() => !a.events.has('e1'))
    expect(a.events.has('e1')).toBe(false)
  })

  it('keeps different sync codes (rooms) isolated', async () => {
    server = await createServer({ port: 0 })
    const a = connect(server.url, 'code-aaaa')
    const b = connect(server.url, 'code-bbbb')

    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    await waitFor(() => a.events.has('e1'))
    // Give any (incorrect) cross-room delivery a chance to arrive.
    await new Promise(r => setTimeout(r, 200))

    expect(b.events.has('e1')).toBe(false)
  })

  it('reconciles edits made while offline after reconnecting', async () => {
    server = await createServer({ port: 0 })
    const a = connect(server.url, 'room-3')
    const b = connect(server.url, 'room-3')

    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    await waitFor(() => b.events.has('e1'))

    // A goes offline and makes a local edit.
    a.provider.disconnect()
    await waitFor(() => a.provider.wsconnected === false)
    a.events.set('e2', { type: 'WorkStopped', id: 'e2', at: 3000 })

    // B, still online, also adds an event — no conflict (distinct ids).
    b.events.set('e3', { type: 'WorkStarted', id: 'e3', at: 4000 })

    // A reconnects: both sides converge to the union.
    a.provider.connect()
    await waitFor(() => a.events.has('e3') && b.events.has('e2'))

    const idsA = [...a.events.keys()].sort()
    const idsB = [...b.events.keys()].sort()
    expect(idsA).toEqual(['e1', 'e2', 'e3'])
    expect(idsB).toEqual(['e1', 'e2', 'e3'])
  })
})
