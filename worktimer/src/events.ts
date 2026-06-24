export const STORAGE_KEY = 'worktimer.events'

export type WorkEvent =
  | { type: 'WorkStarted'; id: string; at: number }
  | { type: 'WorkStopped'; id: string; at: number }

export type NewEvent = Omit<WorkEvent, 'id'>

export function loadEvents(): WorkEvent[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return []
  return JSON.parse(raw) as WorkEvent[]
}

export function appendEvent(ev: NewEvent): WorkEvent {
  const stored: WorkEvent = { ...ev, id: crypto.randomUUID() }
  const events = loadEvents()
  events.push(stored)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  return stored
}

export function replaceEvents(events: WorkEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export function parseEventsJson(text: string): WorkEvent[] {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('expected a JSON array of events')
  return data.map((entry, i) => {
    if (entry === null || typeof entry !== 'object') {
      throw new Error(`entry ${i}: expected object`)
    }
    const { type, id, at } = entry as Record<string, unknown>
    if (type !== 'WorkStarted' && type !== 'WorkStopped') {
      throw new Error(`entry ${i}: unknown type ${JSON.stringify(type)}`)
    }
    if (typeof id !== 'string') throw new Error(`entry ${i}: id must be a string`)
    if (typeof at !== 'number') throw new Error(`entry ${i}: at must be a number`)
    return { type, id, at }
  })
}

export function updateEventAt(id: string, at: number): WorkEvent {
  const events = loadEvents()
  const target = events.find(e => e.id === id)
  if (!target) throw new Error(`event ${id} not found`)
  target.at = at
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  return target
}
