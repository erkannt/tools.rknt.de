import { describe, it, expect } from 'vitest'
import { deriveSessions, elapsedToday } from './sessions'
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
