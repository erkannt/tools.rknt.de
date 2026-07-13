// @vitest-environment node
//
// Verifies that server-side persistence lets devices sync even when they are
// never online at the same time:
//   1. Device A connects, writes an event, then disconnects.
//   2. The server flushes the room to disk and destroys the in-memory doc.
//   3. Device B connects later with a fresh doc and receives A's event.

import { describe, it, expect, afterEach } from 'vitest'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { WebSocket } from 'ws'
import { createServer, type SyncServer } from '../server/server'

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
let tmpDir: string | null = null

afterEach(async () => {
  providers.forEach(p => p.destroy())
  providers.length = 0
  docs.forEach(d => d.destroy())
  docs.length = 0
  if (server) {
    await server.close()
    server = null
  }
  if (tmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    tmpDir = null
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
    if (Date.now() - start > timeoutMs) throw new Error('timed out waiting for convergence')
    await new Promise(r => setTimeout(r, 20))
  }
}

describe('server persistence', () => {
  it('delivers events to a device that was offline when they were written', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worktimer-persist-test-'))
    server = await createServer({
      port: 0,
      allowedOrigins: [TEST_ORIGIN],
      dataDir: tmpDir,
    })

    // Device A connects, waits for the server handshake, then writes an event.
    // Waiting for wsconnected ensures the update reaches the server before disconnect.
    const a = connect(server.url, 'async-room')
    await waitFor(() => a.provider.wsconnected)
    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    await new Promise(r => setTimeout(r, 100))

    // A disconnects; the server flushes the room to disk.
    a.provider.disconnect()
    await waitFor(() => !a.provider.wsconnected)
    // Allow the server's close event to process and flush to disk.
    await new Promise(r => setTimeout(r, 100))

    // Device B connects later with a completely fresh doc.
    const b = connect(server.url, 'async-room')
    await waitFor(() => b.events.has('e1'))
    expect(b.events.get('e1')).toEqual({ type: 'WorkStarted', id: 'e1', at: 1000 })
  })

  it('merges persisted events with new events written before reconnect', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worktimer-persist-test-'))
    server = await createServer({
      port: 0,
      allowedOrigins: [TEST_ORIGIN],
      dataDir: tmpDir,
    })

    // A connects, waits for handshake, writes e1, then disconnects.
    const a = connect(server.url, 'merge-room')
    await waitFor(() => a.provider.wsconnected)
    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    await new Promise(r => setTimeout(r, 100))
    a.provider.disconnect()
    await waitFor(() => !a.provider.wsconnected)
    await new Promise(r => setTimeout(r, 100))

    // B connects with its own offline change e2, then syncs with server.
    const b = connect(server.url, 'merge-room')
    b.events.set('e2', { type: 'WorkStopped', id: 'e2', at: 2000 })

    // Both e1 (from persisted server state) and e2 (written by B) converge.
    await waitFor(() => b.events.has('e1') && b.events.has('e2'))
    expect([...b.events.keys()].sort()).toEqual(['e1', 'e2'])
  })

  it('does not persist when DATA_DIR is not set (in-memory only)', async () => {
    server = await createServer({ port: 0, allowedOrigins: [TEST_ORIGIN] })

    const a = connect(server.url, 'mem-room')
    a.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    await waitFor(() => a.events.has('e1'))

    a.provider.disconnect()
    await waitFor(() => !a.provider.wsconnected)
    await new Promise(r => setTimeout(r, 100))

    // B connects to the same room — server has no memory of e1.
    const b = connect(server.url, 'mem-room')
    await new Promise(r => setTimeout(r, 300))
    expect(b.events.has('e1')).toBe(false)
  })
})
