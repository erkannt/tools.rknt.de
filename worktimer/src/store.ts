// The app's event store, backed by a Yjs document.
//
// Local-first: the Y.Doc is the source of truth, persisted to IndexedDB when
// available. When a sync code is set, a y-websocket provider joins the room
// named by that code so other devices converge. Legacy localStorage data is
// migrated into the doc once on first run.
//
// createStore() builds an independent doc per call (App mounts exactly one;
// tests get a fresh store per render). The most recently created store is
// also exposed through the module-level loadEvents() helper for tests.

import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebsocketProvider } from 'y-websocket'
import {
  STORAGE_KEY,
  eventsMap,
  loadEvents as loadEventsFromDoc,
  appendEvent as appendEventToDoc,
  addSession as addSessionToDoc,
  updateEventAt as updateEventAtInDoc,
  removeEvents as removeEventsFromDoc,
  replaceEvents as replaceEventsInDoc,
  parseEventsJson,
  type WorkEvent,
  type NewEvent,
} from './events'

const SYNC_CODE_KEY = 'worktimer.syncCode'
const MIGRATED_KEY = 'worktimer.migrated'
const LOCAL_DB_NAME = 'worktimer.events'

const SYNC_URL: string =
  (import.meta.env?.VITE_SYNC_URL as string | undefined) ?? 'ws://localhost:1234'

export type SyncStatus = 'offline' | 'connecting' | 'connected'

export type Store = {
  snapshot(): WorkEvent[]
  subscribe(cb: (events: WorkEvent[]) => void): () => void

  appendEvent(ev: NewEvent): WorkEvent
  addSession(startedAt: number, stoppedAt: number): [WorkEvent, WorkEvent]
  updateEventAt(id: string, at: number): WorkEvent
  removeEvents(ids: string[]): void
  replaceEvents(events: WorkEvent[]): void

  getSyncCode(): string | null
  setSyncCode(code: string): void
  clearSyncCode(): void
  shareUrl(): string | null

  getStatus(): SyncStatus
  onStatus(cb: (status: SyncStatus) => void): () => void

  ready: Promise<void>
  destroy(): void
}

/** Crockford base32 alphabet (no I, L, O, U — avoids transcription mistakes). */
const BASE32 = '0123456789abcdefghjkmnpqrstvwxyz'

/** A random, hard-to-guess sync code grouped as xxxx-xxxx-xxxx (~60 bits). */
export function generateSyncCode(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  const chars = Array.from(bytes, b => BASE32[b & 31])
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)]
    .map(g => g.join(''))
    .join('-')
}

/** Normalise user-entered codes so manual typing and paste both work. */
export function normalizeSyncCode(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function readSyncCodeFromHash(): string | null {
  if (typeof location === 'undefined') return null
  const match = location.hash.match(/[#&]sync=([^&]+)/)
  return match ? normalizeSyncCode(decodeURIComponent(match[1])) : null
}

export function createStore(): Store {
  const doc = new Y.Doc()
  const map = eventsMap(doc)

  // Local persistence (skipped where IndexedDB is unavailable, e.g. tests).
  let idb: IndexeddbPersistence | null = null
  let ready: Promise<void>
  if (typeof indexedDB !== 'undefined') {
    idb = new IndexeddbPersistence(LOCAL_DB_NAME, doc)
    ready = idb.whenSynced.then(migrateLegacyData)
  } else {
    migrateLegacyData()
    ready = Promise.resolve()
  }

  function migrateLegacyData(): void {
    try {
      if (typeof localStorage === 'undefined') return
      if (localStorage.getItem(MIGRATED_KEY)) return
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw && map.size === 0) {
        replaceEventsInDoc(doc, parseEventsJson(raw))
      }
      localStorage.setItem(MIGRATED_KEY, '1')
    } catch {
      // A malformed legacy value should not block startup.
    }
  }

  // --- Sync code + websocket provider --------------------------------------

  let provider: WebsocketProvider | null = null
  let status: SyncStatus = 'offline'
  const statusListeners = new Set<(s: SyncStatus) => void>()

  function setStatus(next: SyncStatus): void {
    if (next === status) return
    status = next
    for (const cb of statusListeners) cb(status)
  }

  function connect(code: string): void {
    disconnectProvider()
    provider = new WebsocketProvider(SYNC_URL, code, doc)
    setStatus('connecting')
    provider.on('status', (e: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setStatus(e.status === 'connected' ? 'connected' : 'connecting')
    })
  }

  function disconnectProvider(): void {
    if (provider) {
      provider.destroy()
      provider = null
    }
    setStatus('offline')
  }

  function getStoredCode(): string | null {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(SYNC_CODE_KEY)
  }

  // Adopt a #sync=<code> link if present, else any previously stored code.
  const initialCode = readSyncCodeFromHash() ?? getStoredCode()
  if (initialCode) {
    try {
      localStorage.setItem(SYNC_CODE_KEY, initialCode)
      // Clear the hash so the secret does not linger in the address bar.
      if (typeof location !== 'undefined' && location.hash.includes('sync=')) {
        history.replaceState(null, '', location.pathname + location.search)
      }
    } catch {
      /* ignore storage failures */
    }
    connect(initialCode)
  }

  // --- Reactivity ----------------------------------------------------------

  function snapshot(): WorkEvent[] {
    return loadEventsFromDoc(doc)
  }

  function subscribe(cb: (events: WorkEvent[]) => void): () => void {
    const handler = () => cb(snapshot())
    map.observe(handler)
    cb(snapshot())
    return () => map.unobserve(handler)
  }

  const store: Store = {
    snapshot,
    subscribe,

    appendEvent: ev => appendEventToDoc(doc, ev),
    addSession: (a, b) => addSessionToDoc(doc, a, b),
    updateEventAt: (id, at) => updateEventAtInDoc(doc, id, at),
    removeEvents: ids => removeEventsFromDoc(doc, ids),
    replaceEvents: events => replaceEventsInDoc(doc, events),

    getSyncCode: getStoredCode,
    setSyncCode(code) {
      const normalized = normalizeSyncCode(code)
      if (!normalized) return
      try {
        localStorage.setItem(SYNC_CODE_KEY, normalized)
      } catch {
        /* ignore */
      }
      connect(normalized)
    },
    clearSyncCode() {
      try {
        localStorage.removeItem(SYNC_CODE_KEY)
      } catch {
        /* ignore */
      }
      disconnectProvider()
    },
    shareUrl() {
      const code = getStoredCode()
      if (!code || typeof location === 'undefined') return null
      return `${location.origin}${location.pathname}#sync=${code}`
    },

    getStatus: () => status,
    onStatus(cb) {
      statusListeners.add(cb)
      return () => statusListeners.delete(cb)
    },

    ready,

    destroy() {
      disconnectProvider()
      statusListeners.clear()
      idb?.destroy()
      doc.destroy()
    },
  }

  activeStore = store
  return store
}

// --- Module-level helpers (bound to the most recent store) -----------------
// Primarily a convenience for tests that assert on persisted state.

let activeStore: Store | null = null

export function loadEvents(): WorkEvent[] {
  return activeStore ? activeStore.snapshot() : []
}
