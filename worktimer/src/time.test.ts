import { describe, it, expect } from 'vitest'
import { parseHHMM, formatHHMM, startOfDay, nextDay, isoWeekLabel } from './time'

describe('parseHHMM', () => {
  // anchor: 2026-06-24 13:45:30.500 local
  const anchor = new Date(2026, 5, 24, 13, 45, 30, 500).getTime()
  const dayStart = new Date(2026, 5, 24, 0, 0, 0, 0).getTime()

  it('parses 4 digits as HH:MM relative to the anchor date', () => {
    expect(parseHHMM('0930', anchor)).toBe(dayStart + 9 * 3600_000 + 30 * 60_000)
    expect(parseHHMM('1745', anchor)).toBe(dayStart + 17 * 3600_000 + 45 * 60_000)
  })

  it('accepts midnight and end-of-day extremes', () => {
    expect(parseHHMM('0000', anchor)).toBe(dayStart)
    expect(parseHHMM('2359', anchor)).toBe(dayStart + 23 * 3600_000 + 59 * 60_000)
  })

  it('returns null for non-4-digit input', () => {
    expect(parseHHMM('', anchor)).toBeNull()
    expect(parseHHMM('930', anchor)).toBeNull()
    expect(parseHHMM('09300', anchor)).toBeNull()
    expect(parseHHMM('09:30', anchor)).toBeNull()
    expect(parseHHMM('abcd', anchor)).toBeNull()
  })

  it('returns null when HH is out of range', () => {
    expect(parseHHMM('2400', anchor)).toBeNull()
    expect(parseHHMM('9900', anchor)).toBeNull()
  })

  it('returns null when MM is out of range', () => {
    expect(parseHHMM('0960', anchor)).toBeNull()
    expect(parseHHMM('1099', anchor)).toBeNull()
  })
})

describe('formatHHMM', () => {
  it('renders epoch ms as HHMM in local time', () => {
    const t = new Date(2026, 5, 24, 9, 30, 0).getTime()
    expect(formatHHMM(t)).toBe('0930')
  })

  it('pads single-digit hours and minutes', () => {
    const t = new Date(2026, 5, 24, 1, 5, 0).getTime()
    expect(formatHHMM(t)).toBe('0105')
  })
})

describe('startOfDay / nextDay', () => {
  it('startOfDay returns local midnight', () => {
    const t = new Date(2026, 5, 24, 9, 30, 15).getTime()
    const expected = new Date(2026, 5, 24, 0, 0, 0).getTime()
    expect(startOfDay(t)).toBe(expected)
  })

  it('nextDay advances by one calendar day', () => {
    const t = new Date(2026, 5, 24, 0, 0, 0).getTime()
    const expected = new Date(2026, 5, 25, 0, 0, 0).getTime()
    expect(nextDay(t)).toBe(expected)
  })

  it('isoWeekLabel returns YYYY-Www', () => {
    // Mon 2026-06-15 → ISO 2026-W25
    expect(isoWeekLabel(new Date(2026, 5, 15).getTime())).toBe('2026-W25')
  })

  it('isoWeekLabel rolls week 1 into the year containing its Thursday', () => {
    // Mon 2025-12-29 is in ISO week 1 of 2026 (Thursday 2026-01-01).
    expect(isoWeekLabel(new Date(2025, 11, 29).getTime())).toBe('2026-W01')
  })

  it('isoWeekLabel keeps week 53 in the prior year when applicable', () => {
    // Mon 2026-12-28 is in ISO week 53 of 2026 (Thursday 2026-12-31).
    expect(isoWeekLabel(new Date(2026, 11, 28).getTime())).toBe('2026-W53')
  })

  it('nextDay lands on local midnight after the DST spring-forward', () => {
    // Construct via local-time constructor: Sun 2026-03-29 00:00 is local midnight
    // in any TZ; nextDay should give Mon 2026-03-30 00:00 *local*, regardless of
    // how many wall-clock hours elapsed between them. In TZs without DST, this
    // still passes (24h elapsed); in TZs with spring-forward DST on Mar 29, only
    // 23h elapsed but the local-midnight target is the same.
    const sun = new Date(2026, 2, 29, 0, 0, 0).getTime()
    const mon = new Date(2026, 2, 30, 0, 0, 0).getTime()
    expect(nextDay(sun)).toBe(mon)
  })
})
