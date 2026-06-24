import { describe, it, expect } from 'vitest'
import { parseTimeTrackerCsv } from './csv-import'

const id = () => {
  let n = 0
  return () => `id-${n++}`
}

describe('parseTimeTrackerCsv', () => {
  it('returns empty array for an empty/header-only file', () => {
    expect(parseTimeTrackerCsv('time;type;task;text\n', id())).toEqual([])
  })

  it('maps in/out rows to WorkStarted/WorkStopped', () => {
    const csv = [
      'time;type;task;text',
      '2026-01-05T07:56:00Z;in;Default;',
      '2026-01-05T12:42:00Z;out;;',
    ].join('\n')
    const events = parseTimeTrackerCsv(csv, id())
    expect(events).toEqual([
      { type: 'WorkStarted', id: 'id-0', at: new Date('2026-01-05T07:56:00Z').getTime() },
      { type: 'WorkStopped', id: 'id-1', at: new Date('2026-01-05T12:42:00Z').getTime() },
    ])
  })

  it('handles ISO offsets like +01:00', () => {
    const csv = [
      'time;type;task;text',
      '2026-06-18T07:38:00+01:00;in;Default;',
    ].join('\n')
    const events = parseTimeTrackerCsv(csv, id())
    expect(events[0].at).toBe(new Date('2026-06-18T07:38:00+01:00').getTime())
  })

  it('sorts events by timestamp ascending', () => {
    const csv = [
      'time;type;task;text',
      '2026-01-06T07:00:00Z;in;Default;',
      '2026-01-05T07:00:00Z;in;Default;',
    ].join('\n')
    const events = parseTimeTrackerCsv(csv, id())
    expect(events.map(e => e.at)).toEqual([
      new Date('2026-01-05T07:00:00Z').getTime(),
      new Date('2026-01-06T07:00:00Z').getTime(),
    ])
  })

  it('skips blank lines', () => {
    const csv = 'time;type;task;text\n\n2026-01-05T07:56:00Z;in;Default;\n\n'
    expect(parseTimeTrackerCsv(csv, id())).toHaveLength(1)
  })

  it('tolerates CRLF line endings', () => {
    const csv = 'time;type;task;text\r\n2026-01-05T07:56:00Z;in;Default;\r\n'
    expect(parseTimeTrackerCsv(csv, id())).toHaveLength(1)
  })

  it('throws on unknown type', () => {
    const csv = 'time;type;task;text\n2026-01-05T07:56:00Z;wat;Default;'
    expect(() => parseTimeTrackerCsv(csv, id())).toThrow(/wat/)
  })

  it('throws on unparseable timestamp', () => {
    const csv = 'time;type;task;text\nnot-a-date;in;Default;'
    expect(() => parseTimeTrackerCsv(csv, id())).toThrow()
  })
})
