import { describe, it, expect } from 'vitest'
import { activeTargets, flexBudget } from './targets'
import type { Targets, WorkEvent } from './events'

const T = (id: string, at: number, effectiveFrom: number, mo: number): WorkEvent => ({
  type: 'WorkTargetsSet',
  id,
  at,
  effectiveFrom,
  targets: { Mo: mo, Tu: 0, We: 0, Th: 0, Fr: 0 },
})

const dayMs = (y: number, m: number, d: number) => new Date(y, m, d, 0, 0, 0, 0).getTime()

describe('activeTargets', () => {
  it('returns null when there are no target events', () => {
    expect(activeTargets([], dayMs(2026, 0, 15))).toBeNull()
  })

  it('returns null for a day before any effectiveFrom', () => {
    const events = [T('t1', 1, dayMs(2026, 2, 1), 480)]
    expect(activeTargets(events, dayMs(2026, 1, 15))).toBeNull()
  })

  it('returns the only target set when effective', () => {
    const events = [T('t1', 1, dayMs(2026, 2, 1), 480)]
    const a = activeTargets(events, dayMs(2026, 2, 15))
    expect(a).toEqual({ Mo: 480, Tu: 0, We: 0, Th: 0, Fr: 0 })
  })

  it('picks the latest effectiveFrom <= day', () => {
    const events = [
      T('t1', 1, dayMs(2026, 0, 1), 480),
      T('t2', 2, dayMs(2026, 3, 1), 240),
    ]
    expect(activeTargets(events, dayMs(2026, 2, 31))?.Mo).toBe(480)
    expect(activeTargets(events, dayMs(2026, 3, 1))?.Mo).toBe(240)
  })

  it('on tied effectiveFrom, later-emitted event wins', () => {
    const day = dayMs(2026, 0, 1)
    const events = [T('first', 1, day, 480), T('second', 2, day, 360)]
    expect(activeTargets(events, day)?.Mo).toBe(360)
  })
})

describe('flexBudget', () => {
  const HOUR = 3600_000
  const MIN = 60_000

  const work = (id: string, at: number): WorkEvent => ({ type: 'WorkStarted', id, at })
  const stop = (id: string, at: number): WorkEvent => ({ type: 'WorkStopped', id, at })
  const targets = (
    id: string,
    at: number,
    effectiveFrom: number,
    t: Partial<Targets>,
  ): WorkEvent => ({
    type: 'WorkTargetsSet',
    id,
    at,
    effectiveFrom,
    targets: { Mo: 0, Tu: 0, We: 0, Th: 0, Fr: 0, ...t },
  })

  it('returns 0 when there are no target events', () => {
    const events: WorkEvent[] = [
      work('a', dayMs(2026, 0, 5) + 9 * HOUR),
      stop('b', dayMs(2026, 0, 5) + 17 * HOUR),
    ]
    expect(flexBudget(events, dayMs(2026, 0, 6) + 12 * HOUR)).toBe(0)
  })

  it('subtracts targets from worked time on each weekday', () => {
    // Mon 2026-01-05: 8h work, target 7h => +60 min
    // Tue 2026-01-06: 6h work, target 7h => -60 min
    const mon = dayMs(2026, 0, 5)
    const tue = dayMs(2026, 0, 6)
    const events: WorkEvent[] = [
      targets('t', 1, mon, { Mo: 7 * 60, Tu: 7 * 60 }),
      work('a', mon + 9 * HOUR), stop('b', mon + 17 * HOUR), // 8h
      work('c', tue + 9 * HOUR), stop('d', tue + 15 * HOUR), // 6h
    ]
    expect(flexBudget(events, dayMs(2026, 0, 7) + 12 * HOUR)).toBe(0)
  })

  it('counts weekend work as surplus (target 0)', () => {
    // Sat 2026-01-03: 2h work
    const sat = dayMs(2026, 0, 3)
    const events: WorkEvent[] = [
      targets('t', 1, sat, {}),
      work('a', sat + 10 * HOUR), stop('b', sat + 12 * HOUR),
    ]
    expect(flexBudget(events, dayMs(2026, 0, 4) + 12 * HOUR)).toBe(120 * MIN)
  })

  it('does not count days before any effectiveFrom', () => {
    // Work on Jan 5 (Mon), target effective Feb 1
    const mon = dayMs(2026, 0, 5)
    const events: WorkEvent[] = [
      work('a', mon + 9 * HOUR), stop('b', mon + 17 * HOUR), // 8h
      targets('t', mon + 1, dayMs(2026, 1, 1), { Mo: 7 * 60 }),
    ]
    // Only Feb 2 (Mon) counted — no work that day, target 7h => -420 min
    expect(flexBudget(events, dayMs(2026, 1, 3) + 12 * HOUR)).toBe(-7 * 60 * MIN)
  })

  it('retroactive targets apply to earlier days', () => {
    // Sessions in Jan, target set later but effective Jan 1
    const mon = dayMs(2026, 0, 5)
    const events: WorkEvent[] = [
      work('a', mon + 9 * HOUR), stop('b', mon + 17 * HOUR), // 8h Mon
      targets('t', dayMs(2026, 2, 1), dayMs(2026, 0, 1), { Mo: 7 * 60 }),
    ]
    // Jan 1 (Thu, target Th=0) through Jan 6 (Tue): only Mon contributes (8h-7h=+60).
    // All other Mo–Fr have target 0 so any work counts; no work => 0 contribution.
    expect(flexBudget(events, dayMs(2026, 0, 7) + 12 * HOUR)).toBe(60 * MIN)
  })

  it('includes today with current elapsed time', () => {
    // Today is Mon 2026-01-05; running session started 09:00, now 11:00 => 2h worked
    const mon = dayMs(2026, 0, 5)
    const events: WorkEvent[] = [
      targets('t', 1, mon, { Mo: 8 * 60 }),
      work('a', mon + 9 * HOUR),
    ]
    expect(flexBudget(events, mon + 11 * HOUR)).toBe(-6 * 60 * MIN)
  })
})
