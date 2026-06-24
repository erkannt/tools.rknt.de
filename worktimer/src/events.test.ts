import { describe, it, expect, beforeEach } from 'vitest'
import { loadEvents, appendEvent, updateEventAt, STORAGE_KEY } from './events'

beforeEach(() => {
  localStorage.clear()
})

describe('loadEvents', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadEvents()).toEqual([])
  })

  it('returns parsed events from localStorage', () => {
    const stored = [{ type: 'WorkStarted', id: 'a', at: 1000 }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    expect(loadEvents()).toEqual(stored)
  })
})

describe('appendEvent', () => {
  it('persists a WorkStarted event with a generated id', () => {
    const ev = appendEvent({ type: 'WorkStarted', at: 1234 })

    expect(ev.id).toBeTypeOf('string')
    expect(ev.id.length).toBeGreaterThan(0)
    expect(ev.type).toBe('WorkStarted')
    expect(ev.at).toBe(1234)

    expect(loadEvents()).toEqual([ev])
  })

  it('appends to existing events', () => {
    const first = appendEvent({ type: 'WorkStarted', at: 1000 })
    const second = appendEvent({ type: 'WorkStopped', at: 2000 })

    expect(loadEvents()).toEqual([first, second])
  })

  it('generates distinct ids', () => {
    const a = appendEvent({ type: 'WorkStarted', at: 1 })
    const b = appendEvent({ type: 'WorkStopped', at: 2 })
    expect(a.id).not.toBe(b.id)
  })
})

describe('updateEventAt', () => {
  it('updates the matching event in storage', () => {
    const a = appendEvent({ type: 'WorkStarted', at: 1000 })
    const b = appendEvent({ type: 'WorkStopped', at: 2000 })

    const updated = updateEventAt(b.id, 2500)

    expect(updated.id).toBe(b.id)
    expect(updated.at).toBe(2500)
    expect(loadEvents()).toEqual([a, { ...b, at: 2500 }])
  })

  it('throws when the id is unknown', () => {
    appendEvent({ type: 'WorkStarted', at: 1 })
    expect(() => updateEventAt('nope', 5)).toThrow()
  })
})
