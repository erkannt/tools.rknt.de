import type { WorkEvent } from './events'

export type Session = {
  startId: string
  stopId: string | null
  startedAt: number
  stoppedAt: number | null
}

export function deriveSessions(events: WorkEvent[]): Session[] {
  const sessions: Session[] = []
  for (const ev of events) {
    if (ev.type === 'WorkStarted') {
      sessions.push({ startId: ev.id, stopId: null, startedAt: ev.at, stoppedAt: null })
    } else {
      const open = sessions[sessions.length - 1]
      if (open && open.stopId === null) {
        open.stopId = ev.id
        open.stoppedAt = ev.at
      }
    }
  }
  return sessions
}

function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export type EditInput = {
  startId: string
  start: number
  stop: number | null
}

export type ValidationResult = { ok: true } | { ok: false; reason: string }

export function validateEdit(
  input: EditInput,
  sessions: Session[],
  now: number,
): ValidationResult {
  if (input.stop === null) {
    if (input.start > now) {
      return { ok: false, reason: 'Start must not be in the future.' }
    }
  } else if (input.start >= input.stop) {
    return { ok: false, reason: 'Start must be before stop.' }
  }

  const editedEnd = input.stop ?? now
  for (const s of sessions) {
    if (s.startId === input.startId) continue
    const otherEnd = s.stoppedAt ?? now
    if (input.start < otherEnd && s.startedAt < editedEnd) {
      return { ok: false, reason: 'Overlaps another session.' }
    }
  }

  return { ok: true }
}

export function elapsedOnDay(sessions: Session[], dayStart: number, now: number): number {
  const dayEnd = dayStart + 24 * 60 * 60 * 1000
  let total = 0
  for (const s of sessions) {
    const end = s.stoppedAt ?? now
    const overlap = Math.min(end, dayEnd) - Math.max(s.startedAt, dayStart)
    if (overlap > 0) total += overlap
  }
  return total
}

export function elapsedToday(sessions: Session[], now: number): number {
  return elapsedOnDay(sessions, startOfDay(now), now)
}
