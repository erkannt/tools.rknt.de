// Page-lifecycle resilience for the y-websocket provider.
//
// y-websocket silently drops document updates made while its socket is down;
// they are only delivered by the sync handshake of the next (re)connect. Its
// reconnects run on setTimeout backoff and its dead-socket detection on a 30s
// message timeout — both frozen while a mobile browser suspends the page. So
// a PWA resumed from the background typically has no working connection for
// several seconds, and an edit made in that window (e.g. tapping Stop) is
// lost to other devices if the app is closed again before a reconnect
// completes. The edit survives locally in IndexedDB, which is why reopening
// the app later heals the divergence — but until then every other device
// keeps the stale state.
//
// wireReconnect() closes that window by reconnecting the moment there is a
// reason to: the page becoming visible again, the network coming back, or a
// local edit happening while offline. After a long time hidden it also cycles
// a nominally-open socket, which after a suspension is often a zombie the
// provider would otherwise take up to ~30s to notice.

import type * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

/** Hidden at least this long → assume the socket may have died while frozen. */
const REFRESH_HIDDEN_MS = 30_000

export type WireReconnectOptions = {
  /** Clock, injectable for tests. */
  now?: () => number
  /** Override of REFRESH_HIDDEN_MS for tests. */
  refreshHiddenMs?: number
}

/**
 * Watch page-lifecycle signals and the doc, and reconnect `getProvider()`
 * promptly instead of waiting out y-websocket's backoff. Returns a cleanup
 * function removing all listeners.
 */
export function wireReconnect(
  doc: Y.Doc,
  getProvider: () => WebsocketProvider | null,
  options: WireReconnectOptions = {},
): () => void {
  const now = options.now ?? (() => Date.now())
  const refreshHiddenMs = options.refreshHiddenMs ?? REFRESH_HIDDEN_MS

  // provider.connect() is safe to call at any time: it no-ops while a socket
  // exists and otherwise skips any pending backoff timer. shouldConnect is
  // only false after an explicit disconnect (sync code cleared) — never
  // override that.
  function ensureConnected(): void {
    const provider = getProvider()
    if (provider && provider.shouldConnect && !provider.wsconnected) {
      provider.connect()
    }
  }

  // An edit made while offline should reach the server as soon as possible,
  // not after the current backoff delay — the user may close the app first.
  function onDocUpdate(): void {
    ensureConnected()
  }
  doc.on('update', onDocUpdate)

  let hiddenAt: number | null = null
  function onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      hiddenAt = now()
      return
    }
    const hiddenFor = hiddenAt === null ? 0 : now() - hiddenAt
    hiddenAt = null
    const provider = getProvider()
    if (!provider || !provider.shouldConnect) return
    if (!provider.wsconnected) {
      provider.connect()
    } else if (hiddenFor >= refreshHiddenMs) {
      // The OS may have killed the connection during a long suspension
      // without the socket ever reporting it. Cycle it so the resume always
      // starts from a fresh, fully resynced connection.
      provider.disconnect()
      provider.connect()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('online', ensureConnected)
    window.addEventListener('pageshow', ensureConnected)
  }

  return () => {
    doc.off('update', onDocUpdate)
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', ensureConnected)
      window.removeEventListener('pageshow', ensureConnected)
    }
  }
}
