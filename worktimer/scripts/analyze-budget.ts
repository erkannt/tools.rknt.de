#!/usr/bin/env tsx
import { readFileSync } from 'node:fs'
import { parseEventsJson } from '../src/events.ts'
import { deriveSessions, elapsedOnDay } from '../src/sessions.ts'
import { dailyTarget, flexBudget, weekStartLocal } from '../src/targets.ts'

const path = process.argv[2] ?? 'worktimer-events.json'
const todayArg = process.argv[3]

const events = parseEventsJson(readFileSync(path, 'utf8'))
const sessions = deriveSessions(events)

const lastEventAt = events.reduce((m, e) => Math.max(m, e.at), 0)
const now = todayArg ? new Date(todayArg).getTime() : lastEventAt
const today = (() => {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()

const DAY = 24 * 3600_000
const earliest = events.reduce((m, e) => {
  if (e.type === 'WorkTargetsSet') return Math.min(m, e.effectiveFrom)
  if (e.type === 'TargetOverride') return Math.min(m, e.startDay)
  return m
}, Infinity)

const startDay = (() => {
  const d = new Date(earliest)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()

console.log(`Events: ${events.length} (sessions: ${sessions.length})`)
console.log(`'today' = ${new Date(today).toISOString()}`)
console.log(`Walk from ${new Date(startDay).toISOString()} to today`)

let totalWorked = 0
let totalTarget = 0
const weeks = new Map<number, { worked: number; target: number; days: { day: number; weekday: string; worked: number; target: number; delta: number }[] }>()

const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

for (let d = startDay; d <= today; d += DAY) {
  const tgt = dailyTarget(events, d)
  if (tgt === null) continue
  const worked = elapsedOnDay(sessions, d, now)
  totalWorked += worked
  totalTarget += tgt * 60_000
  const ws = weekStartLocal(d)
  const wk = weeks.get(ws) ?? { worked: 0, target: 0, days: [] }
  wk.worked += worked
  wk.target += tgt * 60_000
  wk.days.push({ day: d, weekday: WD[new Date(d).getDay()], worked, target: tgt * 60_000, delta: worked - tgt * 60_000 })
  weeks.set(ws, wk)
}

let adjustments = 0
for (const e of events) if (e.type === 'FlexAdjusted') adjustments += e.deltaMs

const hhmm = (ms: number) => {
  const sign = ms < 0 ? '-' : '+'
  const m = Math.floor(Math.abs(ms) / 60_000)
  return `${sign}${String(Math.floor(m / 60)).padStart(3, '0')}:${String(m % 60).padStart(2, '0')}`
}
const hm = (ms: number) => {
  const m = Math.floor(Math.max(0, ms) / 60_000)
  return `${String(Math.floor(m / 60)).padStart(3, '0')}:${String(m % 60).padStart(2, '0')}`
}

console.log()
console.log('Per-week summary (week start → worked / target / delta):')
const sorted = Array.from(weeks.entries()).sort((a, b) => a[0] - b[0])
for (const [ws, w] of sorted) {
  const delta = w.worked - w.target
  console.log(`  ${new Date(ws).toISOString().slice(0, 10)}  worked ${hm(w.worked)}  target ${hm(w.target)}  delta ${hhmm(delta)}`)
}

console.log()
console.log('Negative-delta days where worked < target by >2h:')
for (const w of weeks.values()) {
  for (const d of w.days) {
    if (d.delta < -2 * 3600_000) {
      console.log(`  ${new Date(d.day).toISOString().slice(0, 10)} ${d.weekday}  worked ${hm(d.worked)}  target ${hm(d.target)}  delta ${hhmm(d.delta)}`)
    }
  }
}

console.log()
console.log(`Total worked:     ${hm(totalWorked)}`)
console.log(`Total target:     ${hm(totalTarget)}`)
console.log(`Work vs target:   ${hhmm(totalWorked - totalTarget)}`)
console.log(`FlexAdjustments:  ${hhmm(adjustments)}`)
console.log(`flexBudget(): ${hhmm(flexBudget(events, now))}`)
