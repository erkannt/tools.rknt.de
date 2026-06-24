import { describe, it, expect } from 'vitest'
import { generateSampleEvents } from './seed'
import { deriveSessions } from './sessions'

const today = new Date(2026, 5, 24, 12, 0, 0).getTime()

function counter() {
  let n = 0
  return () => `id-${n++}`
}

describe('generateSampleEvents', () => {
  it('produces alternating WorkStarted/WorkStopped events in chronological order', () => {
    const events = generateSampleEvents({ today, days: 7, seed: 1, makeId: counter() })
    expect(events.length).toBeGreaterThan(0)
    for (let i = 0; i < events.length; i++) {
      expect(events[i].type).toBe(i % 2 === 0 ? 'WorkStarted' : 'WorkStopped')
      if (i > 0) expect(events[i].at).toBeGreaterThan(events[i - 1].at)
    }
  })

  it('skips weekends and today', () => {
    const events = generateSampleEvents({ today, days: 14, seed: 1, makeId: counter() })
    const startOfToday = new Date(today)
    startOfToday.setHours(0, 0, 0, 0)
    for (const e of events) {
      const d = new Date(e.at)
      expect(d.getDay()).not.toBe(0) // Sunday
      expect(d.getDay()).not.toBe(6) // Saturday
      expect(e.at).toBeLessThan(startOfToday.getTime())
    }
  })

  it('emits 2-3 sessions per weekday', () => {
    const events = generateSampleEvents({ today, days: 14, seed: 1, makeId: counter() })
    const sessions = deriveSessions(events)
    const byDay = new Map<string, number>()
    for (const s of sessions) {
      const key = new Date(s.startedAt).toDateString()
      byDay.set(key, (byDay.get(key) ?? 0) + 1)
    }
    for (const count of byDay.values()) {
      expect(count).toBeGreaterThanOrEqual(2)
      expect(count).toBeLessThanOrEqual(3)
    }
  })

  it('produces non-overlapping sessions', () => {
    const events = generateSampleEvents({ today, days: 30, seed: 7, makeId: counter() })
    const sessions = deriveSessions(events)
    for (let i = 1; i < sessions.length; i++) {
      expect(sessions[i].startedAt).toBeGreaterThanOrEqual(sessions[i - 1].stoppedAt!)
    }
  })

  it('is deterministic for a given seed', () => {
    const a = generateSampleEvents({ today, days: 30, seed: 42, makeId: counter() })
    const b = generateSampleEvents({ today, days: 30, seed: 42, makeId: counter() })
    expect(a.map(e => ({ type: e.type, at: e.at }))).toEqual(
      b.map(e => ({ type: e.type, at: e.at })),
    )
  })
})
