import { describe, it, expect } from 'vitest'
import { deriveSessions, elapsedToday, elapsedOnDay, validateEdit, type Session } from './sessions'
import type { WorkEvent } from './events'

const ev = (type: 'WorkStarted' | 'WorkStopped', id: string, at: number): WorkEvent => ({
  type,
  id,
  at,
})

describe('deriveSessions', () => {
  it('returns no sessions for empty events', () => {
    expect(deriveSessions([])).toEqual([])
  })

  it('pairs a WorkStarted with the following WorkStopped', () => {
    const sessions = deriveSessions([
      ev('WorkStarted', 'a', 1000),
      ev('WorkStopped', 'b', 2000),
    ])
    expect(sessions).toEqual([
      { startId: 'a', stopId: 'b', startedAt: 1000, stoppedAt: 2000 },
    ])
  })

  it('treats a trailing WorkStarted as a running session', () => {
    const sessions = deriveSessions([ev('WorkStarted', 'a', 1000)])
    expect(sessions).toEqual([
      { startId: 'a', stopId: null, startedAt: 1000, stoppedAt: null },
    ])
  })

  it('handles multiple sessions', () => {
    const sessions = deriveSessions([
      ev('WorkStarted', 'a', 1000),
      ev('WorkStopped', 'b', 2000),
      ev('WorkStarted', 'c', 3000),
    ])
    expect(sessions).toHaveLength(2)
    expect(sessions[1].stoppedAt).toBeNull()
  })
})

describe('elapsedToday', () => {
  // 2026-06-24 in local time
  const today = new Date(2026, 5, 24, 12, 0, 0).getTime()
  const startOfToday = new Date(2026, 5, 24, 0, 0, 0).getTime()
  const startOfYesterday = new Date(2026, 5, 23, 0, 0, 0).getTime()

  it('returns 0 with no sessions', () => {
    expect(elapsedToday([], today)).toBe(0)
  })

  it('sums completed sessions that occurred today', () => {
    const sessions = [
      { startId: 'a', stopId: 'b', startedAt: startOfToday + 1000, stoppedAt: startOfToday + 3000 },
      { startId: 'c', stopId: 'd', startedAt: startOfToday + 5000, stoppedAt: startOfToday + 8000 },
    ]
    expect(elapsedToday(sessions, today)).toBe(5000)
  })

  it('includes a running session counted to now', () => {
    const sessions = [
      { startId: 'a', stopId: null, startedAt: today - 10_000, stoppedAt: null },
    ]
    expect(elapsedToday(sessions, today)).toBe(10_000)
  })

  it('excludes sessions entirely on prior days', () => {
    const sessions = [
      { startId: 'a', stopId: 'b', startedAt: startOfYesterday + 1000, stoppedAt: startOfYesterday + 2000 },
    ]
    expect(elapsedToday(sessions, today)).toBe(0)
  })

  it('clips a session that crosses midnight into today', () => {
    const sessions = [
      { startId: 'a', stopId: 'b', startedAt: startOfToday - 5000, stoppedAt: startOfToday + 2000 },
    ]
    expect(elapsedToday(sessions, today)).toBe(2000)
  })
})

describe('elapsedOnDay', () => {
  const yesterday = new Date(2026, 5, 23, 0, 0, 0).getTime()
  const yesterdayMid = new Date(2026, 5, 23, 12, 0, 0).getTime()
  const today = new Date(2026, 5, 24, 12, 0, 0).getTime()

  it('returns work on a specific past day', () => {
    const sessions = [
      { startId: 'a', stopId: 'b', startedAt: yesterdayMid, stoppedAt: yesterdayMid + 3600_000 },
    ]
    expect(elapsedOnDay(sessions, yesterday, today)).toBe(3600_000)
  })

  it('clips a running session to the day end', () => {
    const sessions = [
      { startId: 'a', stopId: null, startedAt: yesterdayMid, stoppedAt: null },
    ]
    expect(elapsedOnDay(sessions, yesterday, today)).toBe(12 * 3600_000)
  })

  it('returns 0 for an empty day', () => {
    expect(elapsedOnDay([], yesterday, today)).toBe(0)
  })
})

describe('validateEdit', () => {
  const session = (startId: string, startedAt: number, stoppedAt: number | null): Session => ({
    startId,
    stopId: stoppedAt === null ? null : `${startId}-stop`,
    startedAt,
    stoppedAt,
  })

  const now = 1_000_000

  it('accepts a non-overlapping edit', () => {
    const a = session('a', 100, 200)
    const b = session('b', 300, 400)
    const result = validateEdit({ startId: 'b', start: 250, stop: 280 }, [a, b], now)
    expect(result).toEqual({ ok: true })
  })

  it('rejects when start >= stop on a completed session', () => {
    const a = session('a', 100, 200)
    const result = validateEdit({ startId: 'a', start: 200, stop: 200 }, [a], now)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/before/i)
  })

  it('rejects when start > now on a running session', () => {
    const a = session('a', 100, null)
    const result = validateEdit({ startId: 'a', start: now + 1, stop: null }, [a], now)
    expect(result.ok).toBe(false)
  })

  it('accepts a running session with start <= now', () => {
    const a = session('a', 100, null)
    const result = validateEdit({ startId: 'a', start: now, stop: null }, [a], now)
    expect(result).toEqual({ ok: true })
  })

  it('rejects overlap with another completed session', () => {
    const a = session('a', 100, 200)
    const b = session('b', 300, 400)
    const result = validateEdit({ startId: 'b', start: 150, stop: 350 }, [a, b], now)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/overlap/i)
  })

  it('rejects overlap with a running session (uses now as its end)', () => {
    const running = session('r', 500, null)
    const target = session('a', 100, 200)
    const result = validateEdit({ startId: 'a', start: 400, stop: 600 }, [target, running], now)
    expect(result.ok).toBe(false)
  })

  it('allows edited session to occupy its own previous slot exactly', () => {
    const a = session('a', 100, 200)
    const b = session('b', 300, 400)
    // shrinking b within itself should still pass (does not overlap a or itself)
    const result = validateEdit({ startId: 'b', start: 320, stop: 380 }, [a, b], now)
    expect(result).toEqual({ ok: true })
  })

  it('allows adjacency (end-of-one == start-of-other)', () => {
    const a = session('a', 100, 200)
    const b = session('b', 300, 400)
    const result = validateEdit({ startId: 'b', start: 200, stop: 300 }, [a, b], now)
    expect(result).toEqual({ ok: true })
  })
})
