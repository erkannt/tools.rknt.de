import { WEEKDAYS, type Targets, type WorkEvent, type Weekday } from './events'
import { deriveSessions, elapsedOnDay } from './sessions'
import { nextDay, startOfDay } from './time'

const MIN_MS = 60_000

export function weekStartLocal(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0=Sun..6=Sat
  const offset = dow === 0 ? 6 : dow - 1 // days since Monday
  d.setDate(d.getDate() - offset)
  return d.getTime()
}

export function hasOverride(events: WorkEvent[], day: number): boolean {
  for (const ev of events) {
    if (ev.type === 'TargetOverride' && day >= ev.startDay && day <= ev.endDay) return true
  }
  return false
}

function activeOverride(events: WorkEvent[], day: number): number | null {
  let chosenAt = -Infinity
  let chosenVal: number | null = null
  for (const ev of events) {
    if (ev.type !== 'TargetOverride') continue
    if (day < ev.startDay || day > ev.endDay) continue
    if (ev.at >= chosenAt) {
      chosenAt = ev.at
      chosenVal = ev.targetMin
    }
  }
  return chosenVal
}

export function dailyTarget(events: WorkEvent[], day: number): number | null {
  const ovr = activeOverride(events, day)
  if (ovr !== null) return ovr
  const t = activeTargets(events, day)
  if (t === null) return null
  const wd = weekdayKey(day)
  return wd === null ? 0 : t[wd]
}

export function weeklyTarget(events: WorkEvent[], weekStart: number): { mins: number; hasAny: boolean } {
  let total = 0
  let hasAny = false
  let day = weekStart
  for (let i = 0; i < 7; i++) {
    const dt = dailyTarget(events, day)
    if (dt !== null) {
      hasAny = true
      total += dt
    }
    day = nextDay(day)
  }
  return { mins: total, hasAny }
}

function weekdayKey(day: number): Weekday | null {
  const idx = new Date(day).getDay() // 0=Sun..6=Sat
  if (idx === 0 || idx === 6) return null
  return WEEKDAYS[idx - 1]
}

export function activeTargetEvent(events: WorkEvent[], day: number): WorkEvent | null {
  let chosen: WorkEvent | null = null
  let chosenFrom = -Infinity
  for (const ev of events) {
    if (ev.type !== 'WorkTargetsSet') continue
    if (ev.effectiveFrom > day) continue
    if (ev.effectiveFrom >= chosenFrom) {
      chosen = ev
      chosenFrom = ev.effectiveFrom
    }
  }
  return chosen
}

export function activeTargets(events: WorkEvent[], day: number): Targets | null {
  const ev = activeTargetEvent(events, day)
  return ev?.type === 'WorkTargetsSet' ? ev.targets : null
}

export function flexBudget(events: WorkEvent[], now: number): number {
  let total = 0
  for (const ev of events) {
    if (ev.type === 'FlexAdjusted') total += ev.deltaMs
  }

  let earliest = Infinity
  for (const ev of events) {
    if (ev.type === 'WorkTargetsSet' && ev.effectiveFrom < earliest) {
      earliest = ev.effectiveFrom
    }
    if (ev.type === 'TargetOverride' && ev.startDay < earliest) {
      earliest = ev.startDay
    }
  }
  if (earliest === Infinity) return total

  const sessions = deriveSessions(events)
  const lastDay = startOfDay(now)
  for (let day = startOfDay(earliest); day <= lastDay; day = nextDay(day)) {
    const targetMin = dailyTarget(events, day)
    if (targetMin === null) continue
    const worked = elapsedOnDay(sessions, day, now)
    total += worked - targetMin * MIN_MS
  }
  return total
}
