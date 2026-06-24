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

export function updateEventAt(id: string, at: number): WorkEvent {
  const events = loadEvents()
  const target = events.find(e => e.id === id)
  if (!target) throw new Error(`event ${id} not found`)
  target.at = at
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  return target
}
