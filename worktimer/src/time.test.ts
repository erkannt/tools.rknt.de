import { describe, it, expect } from 'vitest'
import { parseHHMM, formatHHMM } from './time'

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
