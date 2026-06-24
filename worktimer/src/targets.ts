import { WEEKDAYS, type Targets, type WorkEvent, type Weekday } from './events'
import { deriveSessions, elapsedOnDay } from './sessions'

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_MS = 60_000

function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function weekStartLocal(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0=Sun..6=Sat
  const offset = dow === 0 ? 6 : dow - 1 // days since Monday
  d.setDate(d.getDate() - offset)
  return d.getTime()
}

export function dailyTarget(events: WorkEvent[], day: number): number | null {
  const t = activeTargets(events, day)
  if (t === null) return null
  const wd = weekdayKey(day)
  return wd === null ? 0 : t[wd]
}

export function weeklyTarget(events: WorkEvent[], weekStart: number): { mins: number; hasAny: boolean } {
  let total = 0
  let hasAny = false
  for (let i = 0; i < 7; i++) {
    const day = weekStart + i * DAY_MS
    const dt = dailyTarget(events, day)
    if (dt === null) continue
    hasAny = true
    total += dt
  }
  return { mins: total, hasAny }
}

function weekdayKey(day: number): Weekday | null {
  const idx = new Date(day).getDay() // 0=Sun..6=Sat
  if (idx === 0 || idx === 6) return null
  return WEEKDAYS[idx - 1]
}

export function activeTargets(events: WorkEvent[], day: number): Targets | null {
  let chosen: Targets | null = null
  let chosenFrom = -Infinity
  for (const ev of events) {
    if (ev.type !== 'WorkTargetsSet') continue
    if (ev.effectiveFrom > day) continue
    if (ev.effectiveFrom >= chosenFrom) {
      chosen = ev.targets
      chosenFrom = ev.effectiveFrom
    }
  }
  return chosen
}

export function flexBudget(events: WorkEvent[], now: number): number {
  let earliest = Infinity
  for (const ev of events) {
    if (ev.type === 'WorkTargetsSet' && ev.effectiveFrom < earliest) {
      earliest = ev.effectiveFrom
    }
  }
  if (earliest === Infinity) return 0

  const sessions = deriveSessions(events)
  const lastDay = startOfDay(now)
  let total = 0
  for (let day = startOfDay(earliest); day <= lastDay; day += DAY_MS) {
    const targets = activeTargets(events, day)
    if (!targets) continue
    const wd = weekdayKey(day)
    const targetMin = wd === null ? 0 : targets[wd]
    const worked = elapsedOnDay(sessions, day, now)
    total += worked - targetMin * MIN_MS
  }
  return total
}
