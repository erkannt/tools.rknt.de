import { describe, it, expect } from 'vitest'
import { generateSampleEvents } from './seed'
import { flexBudget } from './targets'
import type { WorkEvent } from './events'

// Realistic worst-case: ~6 months of weekday sessions plus a retroactive
// WorkTargetsSet covering the whole range. The pre-refactor implementation
// walked every day × every event on each call.
function buildHeavyDataset(): { events: WorkEvent[]; now: number } {
  const now = new Date(2026, 5, 24, 12, 0, 0).getTime()
  const events: WorkEvent[] = generateSampleEvents({
    today: now,
    days: 180,
    seed: 42,
    makeId: (() => {
      let n = 0
      return () => `s-${n++}`
    })(),
  })
  const start2026 = new Date(2026, 0, 1).getTime()
  events.push({
    type: 'WorkTargetsSet',
    id: 'tgt',
    at: 1,
    effectiveFrom: start2026,
    targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
  })
  return { events, now }
}

function timeMs(fn: () => void): number {
  const t0 = performance.now()
  fn()
  return performance.now() - t0
}

// Thresholds tightened to ~3-5x the observed numbers on a dev laptop, so
// they trip on meaningful regressions (not just the catastrophic O(days ×
// events) shape, but anything that quietly slows the hot path).
describe('performance', () => {
  it('flexBudget on a 6-month dataset takes under 10ms (best of 5)', () => {
    const { events, now } = buildHeavyDataset()

    // Warmup so JIT doesn't pollute the measurement.
    for (let i = 0; i < 3; i++) flexBudget(events, now)

    const samples: number[] = []
    for (let i = 0; i < 5; i++) samples.push(timeMs(() => flexBudget(events, now)))
    const best = Math.min(...samples)

    expect(best).toBeLessThan(10)
  })

  it('60 flexBudget calls (a minute of ticks) complete under 200ms', () => {
    const { events, now } = buildHeavyDataset()

    for (let i = 0; i < 3; i++) flexBudget(events, now)

    const total = timeMs(() => {
      for (let i = 0; i < 60; i++) flexBudget(events, now + i * 1000)
    })

    expect(total).toBeLessThan(200)
  })
})
