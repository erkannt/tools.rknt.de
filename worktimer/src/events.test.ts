import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadEvents,
  appendEvent,
  updateEventAt,
  replaceEvents,
  parseEventsJson,
  STORAGE_KEY,
} from './events'

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

describe('replaceEvents', () => {
  it('overwrites the persisted log', () => {
    appendEvent({ type: 'WorkStarted', at: 1 })
    appendEvent({ type: 'WorkStopped', at: 2 })

    const next = [
      { type: 'WorkStarted' as const, id: 'x', at: 100 },
      { type: 'WorkStopped' as const, id: 'y', at: 200 },
    ]
    replaceEvents(next)

    expect(loadEvents()).toEqual(next)
  })

  it('clears the log when given an empty array', () => {
    appendEvent({ type: 'WorkStarted', at: 1 })
    replaceEvents([])
    expect(loadEvents()).toEqual([])
  })
})

describe('parseEventsJson', () => {
  const valid = [
    { type: 'WorkStarted', id: 'a', at: 1000 },
    { type: 'WorkStopped', id: 'b', at: 2000 },
  ]

  it('parses a well-formed array', () => {
    expect(parseEventsJson(JSON.stringify(valid))).toEqual(valid)
  })

  it('accepts an empty array', () => {
    expect(parseEventsJson('[]')).toEqual([])
  })

  it('throws on invalid JSON', () => {
    expect(() => parseEventsJson('not json')).toThrow()
  })

  it('throws when payload is not an array', () => {
    expect(() => parseEventsJson('{}')).toThrow(/array/i)
  })

  it('throws when an entry has an unknown type', () => {
    const bad = [{ type: 'Bogus', id: 'a', at: 1 }]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow(/type/i)
  })

  it('throws when an entry is missing required fields', () => {
    const bad = [{ type: 'WorkStarted', id: 'a' }]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow()
  })

  it('throws when at is not a number', () => {
    const bad = [{ type: 'WorkStarted', id: 'a', at: '1000' }]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow()
  })
})
