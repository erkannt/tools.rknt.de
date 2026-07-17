// @vitest-environment node
//
// Reproduces and guards against the "phone stopped the session but the server
// never heard about it" failure:
//
//   1. Phone PWA and desktop are in sync, desktop tab is closed.
//   2. The phone is backgrounded; the OS freezes the page and kills the
//      websocket. y-websocket cannot reconnect while frozen, and its timers
//      (reconnect backoff, zombie detection) resume late after the app wakes.
//   3. The user reopens the PWA, taps Stop, and immediately closes it.
//      y-websocket drops updates made while the socket is down — they are only
//      delivered by the sync handshake of the *next* reconnect, which never
//      happens before the app closes. The stop event exists only in the
//      phone's IndexedDB; the server (and any device syncing through it)
//      still shows the session as running.
//
// The suspension is simulated by bouncing the server: the phone's socket dies
// and repeated reconnect attempts fail, pushing y-websocket's exponential
// backoff out (like the frozen page's timers). Once the server is back
// ("network restored / app resumed"), the pre-fix store would sit out the
// backoff — wireReconnect instead reconnects immediately on page-lifecycle
// signals and on local edits made while offline.

import { describe, it, expect, afterEach } from 'vitest'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { WebSocket } from 'ws'
import { createServer, type SyncServer } from '../server/server'
import { wireReconnect } from './reconnect'

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
const cleanups: Array<() => void> = []
let tmpDir: string | null = null

afterEach(async () => {
  cleanups.forEach(c => c())
  cleanups.length = 0
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
    if (Date.now() - start > timeoutMs) throw new Error('timed out waiting for condition')
    await new Promise(r => setTimeout(r, 20))
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function startServer(port = 0): Promise<SyncServer> {
  if (!tmpDir) tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worktimer-reconnect-test-'))
  return createServer({ port, allowedOrigins: [TEST_ORIGIN], dataDir: tmpDir })
}

/**
 * Simulate the phone being suspended while its connection dies: take the
 * server down, let the provider burn through several failed reconnect
 * attempts so its next retry sits far out in exponential backoff, then bring
 * the server back on the same port. Mirrors a resumed PWA whose provider has
 * not yet re-established a connection.
 */
async function suspendAndResume(phone: { provider: WebsocketProvider }): Promise<void> {
  const port = server!.port
  await server!.close()
  server = null
  await waitFor(() => !phone.provider.wsconnected)
  // Failed attempts at ~100/200/400/800/1600ms: after this the next automatic
  // retry is >= 1.6s away, leaving a wide window in which only an explicit
  // reconnect can deliver anything.
  await sleep(1900)
  server = await startServer(port)
}

// Minimal document/window shims (node environment, so the real ws server can
// run in-process): just enough for wireReconnect's lifecycle listeners.
let visibility = 'visible'
const documentShim = new EventTarget()
Object.defineProperty(documentShim, 'visibilityState', { get: () => visibility })
const windowShim = new EventTarget()
;(globalThis as Record<string, unknown>).document = documentShim
;(globalThis as Record<string, unknown>).window = windowShim
function setVisibility(v: 'visible' | 'hidden'): void {
  visibility = v
  documentShim.dispatchEvent(new Event('visibilitychange'))
}

describe('suspended-PWA update loss', () => {
  it('reproduces the bug: without lifecycle handling, a stop written before the backoff reconnect is lost', async () => {
    server = await startServer()
    const room = 'repro-room'

    // Phone and desktop in sync on a running session; desktop tab closes.
    const phone = connect(server.url, room)
    await waitFor(() => phone.provider.wsconnected)
    phone.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    const desktop = connect(server.url, room)
    await waitFor(() => desktop.events.has('e1'))
    desktop.provider.destroy()

    // Phone is backgrounded and its socket dies; server comes back later.
    await suspendAndResume(phone)

    // User reopens the PWA, taps Stop, and closes it before y-websocket's
    // backed-off reconnect fires. The update is dropped, not queued.
    phone.events.set('e2', { type: 'WorkStopped', id: 'e2', at: 2000 })
    phone.provider.destroy()

    // Desktop reopens with a fresh view of the room: still "running".
    const desktop2 = connect(server!.url, room)
    await waitFor(() => desktop2.events.has('e1'))
    await sleep(300)
    expect(desktop2.events.has('e2')).toBe(false)
  })

  it('fix: resuming the page reconnects immediately and the stop reaches other devices', async () => {
    server = await startServer()
    const room = 'fix-room'

    const phone = connect(server.url, room)
    cleanups.push(wireReconnect(phone.doc, () => phone.provider))
    await waitFor(() => phone.provider.wsconnected)
    phone.events.set('e1', { type: 'WorkStarted', id: 'e1', at: 1000 })
    const desktop = connect(server.url, room)
    await waitFor(() => desktop.events.has('e1'))
    desktop.provider.destroy()

    setVisibility('hidden')
    await suspendAndResume(phone)

    // Resume: visibility triggers an immediate reconnect (no backoff wait),
    // so by the time the user taps Stop the socket is live again.
    setVisibility('visible')
    await waitFor(() => phone.provider.wsconnected, 1000)
    phone.events.set('e2', { type: 'WorkStopped', id: 'e2', at: 2000 })
    await sleep(200)
    phone.provider.destroy()

    const desktop2 = connect(server!.url, room)
    await waitFor(() => desktop2.events.has('e2'))
    expect(desktop2.events.get('e2')).toEqual({ type: 'WorkStopped', id: 'e2', at: 2000 })
  })

  it('fix: a local edit made while offline triggers an immediate delivery attempt', async () => {
    server = await startServer()
    const room = 'edit-room'

    const phone = connect(server.url, room)
    cleanups.push(wireReconnect(phone.doc, () => phone.provider))
    await waitFor(() => phone.provider.wsconnected)

    await suspendAndResume(phone)

    // No visibility event this time — the edit itself must force the
    // reconnect, well before the >=1.6s backed-off retry.
    phone.events.set('e2', { type: 'WorkStopped', id: 'e2', at: 2000 })
    await waitFor(() => phone.provider.wsconnected, 1000)
    await sleep(200)
    phone.provider.destroy()

    const desktop = connect(server!.url, room)
    await waitFor(() => desktop.events.has('e2'))
    expect(desktop.events.has('e2')).toBe(true)
  })

  it('fix: after a long time hidden, an apparently-open socket is cycled to force a resync', async () => {
    server = await startServer()
    const room = 'zombie-room'

    let fakeNow = 0
    const phone = connect(server.url, room)
    cleanups.push(
      wireReconnect(phone.doc, () => phone.provider, {
        now: () => fakeNow,
        refreshHiddenMs: 30_000,
      }),
    )
    await waitFor(() => phone.provider.wsconnected)
    const socketBefore = phone.provider.ws

    // Backgrounded for "35s": the socket may be a zombie by now, so resume
    // must tear it down and reconnect rather than trust it.
    setVisibility('hidden')
    fakeNow += 35_000
    setVisibility('visible')

    await waitFor(() => phone.provider.wsconnected && phone.provider.ws !== socketBefore, 2000)
    expect(phone.provider.ws).not.toBe(socketBefore)
  })

  it('fix: a short hide does not churn a healthy connection', async () => {
    server = await startServer()
    const room = 'short-hide-room'

    let fakeNow = 0
    const phone = connect(server.url, room)
    cleanups.push(
      wireReconnect(phone.doc, () => phone.provider, {
        now: () => fakeNow,
        refreshHiddenMs: 30_000,
      }),
    )
    await waitFor(() => phone.provider.wsconnected)
    const socketBefore = phone.provider.ws

    setVisibility('hidden')
    fakeNow += 1_000
    setVisibility('visible')

    await sleep(200)
    expect(phone.provider.ws).toBe(socketBefore)
    expect(phone.provider.wsconnected).toBe(true)
  })
})
