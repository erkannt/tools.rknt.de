import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadEvents,
  appendEvent,
  updateEventAt,
  replaceEvents,
  removeEvents,
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

describe('events array ordering', () => {
  it('appendEvent inserts back-dated events in chronological position', () => {
    const a = appendEvent({ type: 'WorkStarted', at: 1000 })
    const b = appendEvent({ type: 'WorkStarted', at: 500 })

    const stored = loadEvents()
    expect(stored.map(e => e.id)).toEqual([b.id, a.id])
  })

  it('updateEventAt re-sorts when the new at moves the event', () => {
    const a = appendEvent({ type: 'WorkStarted', at: 1000 })
    const b = appendEvent({ type: 'WorkStopped', at: 2000 })

    updateEventAt(a.id, 3000)

    const stored = loadEvents()
    expect(stored.map(e => e.id)).toEqual([b.id, a.id])
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

describe('removeEvents', () => {
  it('removes events with the given ids', () => {
    const a = appendEvent({ type: 'WorkStarted', at: 1 })
    const b = appendEvent({ type: 'WorkStopped', at: 2 })
    const c = appendEvent({ type: 'WorkStarted', at: 3 })

    removeEvents([a.id, b.id])

    expect(loadEvents()).toEqual([c])
  })

  it('is a no-op for unknown ids', () => {
    const a = appendEvent({ type: 'WorkStarted', at: 1 })
    removeEvents(['nope'])
    expect(loadEvents()).toEqual([a])
  })

  it('handles an empty id list', () => {
    const a = appendEvent({ type: 'WorkStarted', at: 1 })
    removeEvents([])
    expect(loadEvents()).toEqual([a])
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

  it('parses a WorkTargetsSet event', () => {
    const payload = [
      {
        type: 'WorkTargetsSet',
        id: 't1',
        at: 1000,
        effectiveFrom: 500,
        targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
      },
    ]
    expect(parseEventsJson(JSON.stringify(payload))).toEqual(payload)
  })

  it('throws when WorkTargetsSet targets is missing a weekday', () => {
    const bad = [
      {
        type: 'WorkTargetsSet',
        id: 't1',
        at: 1000,
        effectiveFrom: 500,
        targets: { Mo: 480, Tu: 480, We: 480, Th: 480 }, // Fr missing
      },
    ]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow(/Fr/)
  })

  it('throws when WorkTargetsSet effectiveFrom is not a number', () => {
    const bad = [
      {
        type: 'WorkTargetsSet',
        id: 't1',
        at: 1000,
        effectiveFrom: '500',
        targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
      },
    ]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow()
  })

  it('parses a FlexAdjusted event', () => {
    const payload = [
      { type: 'FlexAdjusted', id: 'f1', at: 1000, deltaMs: 3 * 3600_000, reason: 'TOIL' },
    ]
    expect(parseEventsJson(JSON.stringify(payload))).toEqual(payload)
  })

  it('accepts a negative FlexAdjusted deltaMs and empty reason', () => {
    const payload = [
      { type: 'FlexAdjusted', id: 'f1', at: 1000, deltaMs: -30 * 60_000, reason: '' },
    ]
    expect(parseEventsJson(JSON.stringify(payload))).toEqual(payload)
  })

  it('throws when FlexAdjusted deltaMs is not a number', () => {
    const bad = [{ type: 'FlexAdjusted', id: 'f1', at: 1000, deltaMs: '30', reason: '' }]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow()
  })

  it('throws when FlexAdjusted reason is not a string', () => {
    const bad = [{ type: 'FlexAdjusted', id: 'f1', at: 1000, deltaMs: 0, reason: null }]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow()
  })

  it('parses a TargetOverride event', () => {
    const payload = [
      {
        type: 'TargetOverride',
        id: 'o1',
        at: 1000,
        startDay: 100,
        endDay: 200,
        targetMin: 0,
        reason: 'holiday',
      },
    ]
    expect(parseEventsJson(JSON.stringify(payload))).toEqual(payload)
  })

  it('throws when TargetOverride startDay/endDay are not numbers', () => {
    const bad = [{ type: 'TargetOverride', id: 'o', at: 1, startDay: '100', endDay: 200, targetMin: 0, reason: '' }]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow()
  })

  it('throws when TargetOverride targetMin is not a number', () => {
    const bad = [{ type: 'TargetOverride', id: 'o', at: 1, startDay: 100, endDay: 200, targetMin: '0', reason: '' }]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow()
  })

  it('throws when a target value is not a number', () => {
    const bad = [
      {
        type: 'WorkTargetsSet',
        id: 't1',
        at: 1000,
        effectiveFrom: 500,
        targets: { Mo: '480', Tu: 480, We: 480, Th: 480, Fr: 480 },
      },
    ]
    expect(() => parseEventsJson(JSON.stringify(bad))).toThrow()
  })
})
