// File-based persistence for Yjs documents.
//
// Each room is stored as a single binary snapshot file named after the SHA-256
// hash of the room name (avoids path-traversal risks and works with any room
// name format). Writes are debounced so rapid edits don't thrash the disk;
// flushPersist cancels the pending timer and writes immediately — used when
// the last client disconnects so we don't lose the final state.
//
// TTL is enforced via the file mtime: each write updates it, and a cleanup
// pass (run at startup and hourly) deletes files older than `ttlDays`.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import * as Y from 'yjs'

const DEBOUNCE_MS = 500
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000

function roomFile(dataDir: string, name: string): string {
  const hash = crypto.createHash('sha256').update(name).digest('hex')
  return path.join(dataDir, `${hash}.bin`)
}

export type PersistStore = {
  loadSync(name: string, doc: Y.Doc): void
  persist(name: string, doc: Y.Doc): void
  flushPersist(name: string, doc: Y.Doc): void
  cleanup(): void
  destroy(): void
}

export function createPersistStore(dataDir: string, ttlDays: number): PersistStore {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function writeFile(name: string, doc: Y.Doc): void {
    const file = roomFile(dataDir, name)
    const tmp = file + '.tmp'
    try {
      fs.writeFileSync(tmp, Y.encodeStateAsUpdate(doc))
      fs.renameSync(tmp, file)
    } catch (err) {
      console.warn(`persistence: failed to write "${name}":`, err)
    }
  }

  function loadSync(name: string, doc: Y.Doc): void {
    const file = roomFile(dataDir, name)
    try {
      const data = fs.readFileSync(file)
      Y.applyUpdate(doc, data)
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`persistence: failed to load "${name}":`, err)
      }
    }
  }

  function persist(name: string, doc: Y.Doc): void {
    const existing = timers.get(name)
    if (existing) clearTimeout(existing)
    timers.set(
      name,
      setTimeout(() => {
        timers.delete(name)
        writeFile(name, doc)
      }, DEBOUNCE_MS),
    )
  }

  function flushPersist(name: string, doc: Y.Doc): void {
    const existing = timers.get(name)
    if (!existing) return
    clearTimeout(existing)
    timers.delete(name)
    writeFile(name, doc)
  }

  function cleanup(): void {
    const cutoff = Date.now() - ttlDays * 24 * 60 * 60 * 1000
    let deleted = 0
    try {
      for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.bin')) continue
        const file = path.join(dataDir, entry.name)
        try {
          if (fs.statSync(file).mtimeMs < cutoff) {
            fs.unlinkSync(file)
            deleted++
          }
        } catch {
          /* already gone or inaccessible */
        }
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('persistence: cleanup scan failed:', err)
      }
    }
    if (deleted > 0) console.log(`persistence: pruned ${deleted} expired room(s)`)
  }

  const interval = setInterval(cleanup, CLEANUP_INTERVAL_MS)
  interval.unref()

  function destroy(): void {
    clearInterval(interval)
    for (const t of timers.values()) clearTimeout(t)
    timers.clear()
  }

  return { loadSync, persist, flushPersist, cleanup, destroy }
}
