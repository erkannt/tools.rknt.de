import { describe, it, expect } from 'vitest'
import { activeTargets } from './targets'
import type { WorkEvent } from './events'

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
