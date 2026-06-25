import * as Y from 'yjs'

/** Legacy localStorage key — kept only for one-time migration into the Y.Doc. */
export const STORAGE_KEY = 'worktimer.events'

/** Name of the Y.Map (keyed by event id) that holds the event log. */
export const EVENTS_MAP = 'events'

export type Weekday = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr'
export const WEEKDAYS: Weekday[] = ['Mo', 'Tu', 'We', 'Th', 'Fr']
export type Targets = Record<Weekday, number>

export type WorkEvent =
  | { type: 'WorkStarted'; id: string; at: number }
  | { type: 'WorkStopped'; id: string; at: number }
  | {
      type: 'WorkTargetsSet'
      id: string
      at: number
      effectiveFrom: number
      targets: Targets
    }
  | { type: 'FlexAdjusted'; id: string; at: number; deltaMs: number; reason: string }
  | {
      type: 'TargetOverride'
      id: string
      at: number
      startDay: number
      endDay: number
      targetMin: number
      reason: string
    }

export type NewEvent =
  | { type: 'WorkStarted'; at: number }
  | { type: 'WorkStopped'; at: number }
  | { type: 'WorkTargetsSet'; at: number; effectiveFrom: number; targets: Targets }
  | { type: 'FlexAdjusted'; at: number; deltaMs: number; reason: string }
  | {
      type: 'TargetOverride'
      at: number
      startDay: number
      endDay: number
      targetMin: number
      reason: string
    }

/** The event log lives in a Y.Map keyed by event id; order is derived by `at`. */
export function eventsMap(doc: Y.Doc): Y.Map<WorkEvent> {
  return doc.getMap<WorkEvent>(EVENTS_MAP)
}

export function loadEvents(doc: Y.Doc): WorkEvent[] {
  return Array.from(eventsMap(doc).values()).sort((a, b) => a.at - b.at)
}

export function addSession(
  doc: Y.Doc,
  startedAt: number,
  stoppedAt: number,
): [WorkEvent, WorkEvent] {
  const start: WorkEvent = { type: 'WorkStarted', id: crypto.randomUUID(), at: startedAt }
  const stop: WorkEvent = { type: 'WorkStopped', id: crypto.randomUUID(), at: stoppedAt }
  const map = eventsMap(doc)
  doc.transact(() => {
    map.set(start.id, start)
    map.set(stop.id, stop)
  })
  return [start, stop]
}

export function appendEvent(doc: Y.Doc, ev: NewEvent): WorkEvent {
  const stored: WorkEvent = { ...ev, id: crypto.randomUUID() }
  eventsMap(doc).set(stored.id, stored)
  return stored
}

export function replaceEvents(doc: Y.Doc, events: WorkEvent[]): void {
  const map = eventsMap(doc)
  doc.transact(() => {
    map.clear()
    for (const e of events) map.set(e.id, e)
  })
}

export function removeEvents(doc: Y.Doc, ids: string[]): void {
  if (ids.length === 0) return
  const map = eventsMap(doc)
  doc.transact(() => {
    for (const id of ids) map.delete(id)
  })
}

export function parseEventsJson(text: string): WorkEvent[] {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('expected a JSON array of events')
  return data.map((entry, i) => {
    if (entry === null || typeof entry !== 'object') {
      throw new Error(`entry ${i}: expected object`)
    }
    const { type, id, at } = entry as Record<string, unknown>
    if (typeof id !== 'string') throw new Error(`entry ${i}: id must be a string`)
    if (typeof at !== 'number') throw new Error(`entry ${i}: at must be a number`)
    if (type === 'WorkStarted' || type === 'WorkStopped') {
      return { type, id, at }
    }
    if (type === 'WorkTargetsSet') {
      const { effectiveFrom, targets } = entry as Record<string, unknown>
      if (typeof effectiveFrom !== 'number') {
        throw new Error(`entry ${i}: effectiveFrom must be a number`)
      }
      if (targets === null || typeof targets !== 'object') {
        throw new Error(`entry ${i}: targets must be an object`)
      }
      const t = targets as Record<string, unknown>
      const parsed: Targets = { Mo: 0, Tu: 0, We: 0, Th: 0, Fr: 0 }
      for (const day of WEEKDAYS) {
        if (typeof t[day] !== 'number') {
          throw new Error(`entry ${i}: targets.${day} must be a number`)
        }
        parsed[day] = t[day] as number
      }
      return { type, id, at, effectiveFrom, targets: parsed }
    }
    if (type === 'FlexAdjusted') {
      const { deltaMs, reason } = entry as Record<string, unknown>
      if (typeof deltaMs !== 'number') {
        throw new Error(`entry ${i}: deltaMs must be a number`)
      }
      if (typeof reason !== 'string') {
        throw new Error(`entry ${i}: reason must be a string`)
      }
      return { type, id, at, deltaMs, reason }
    }
    if (type === 'TargetOverride') {
      const { startDay, endDay, targetMin, reason } = entry as Record<string, unknown>
      if (typeof startDay !== 'number') throw new Error(`entry ${i}: startDay must be a number`)
      if (typeof endDay !== 'number') throw new Error(`entry ${i}: endDay must be a number`)
      if (typeof targetMin !== 'number') throw new Error(`entry ${i}: targetMin must be a number`)
      if (typeof reason !== 'string') throw new Error(`entry ${i}: reason must be a string`)
      return { type, id, at, startDay, endDay, targetMin, reason }
    }
    throw new Error(`entry ${i}: unknown type ${JSON.stringify(type)}`)
  })
}

export function updateEventAt(doc: Y.Doc, id: string, at: number): WorkEvent {
  const map = eventsMap(doc)
  const current = map.get(id)
  if (!current) throw new Error(`event ${id} not found`)
  const updated = { ...current, at } as WorkEvent
  map.set(id, updated)
  return updated
}
