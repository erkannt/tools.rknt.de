import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import { tick } from 'svelte'
import App from './App.svelte'
import { loadEvents } from './events'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  it('adds a session via the Add session form', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0))
    try {
      const { getByLabelText, getByRole } = render(App)
      await fireEvent.input(getByLabelText(/^date$/i), { target: { value: '2026-06-22' } })
      await fireEvent.input(getByLabelText(/^session start$/i), { target: { value: '0900' } })
      await fireEvent.input(getByLabelText(/^session end$/i), { target: { value: '1230' } })
      await fireEvent.click(getByRole('button', { name: /add session/i }))

      const stored = loadEvents()
      expect(stored.map(e => e.type)).toEqual(['WorkStarted', 'WorkStopped'])
      expect(stored[0].at).toBe(new Date(2026, 5, 22, 9, 0).getTime())
      expect(stored[1].at).toBe(new Date(2026, 5, 22, 12, 30).getTime())
    } finally {
      vi.useRealTimers()
    }
  })

  it('displays the resulting session length live as inputs change', async () => {
    const { getByLabelText, getByTestId } = render(App)
    await fireEvent.input(getByLabelText(/^date$/i), { target: { value: '2026-06-22' } })
    await fireEvent.input(getByLabelText(/^session start$/i), { target: { value: '0900' } })
    await fireEvent.input(getByLabelText(/^session end$/i), { target: { value: '1230' } })
    expect(getByTestId('add-session-length').textContent).toBe('03:30')

    await fireEvent.input(getByLabelText(/^session end$/i), { target: { value: '1700' } })
    expect(getByTestId('add-session-length').textContent).toBe('08:00')
  })

  it('rejects an added session that overlaps an existing one', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0))
    try {
      const day = new Date(2026, 5, 22, 0, 0, 0).getTime()
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'a', at: day + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'b', at: day + 12 * 3600_000 },
        ]),
      )
      const { getByLabelText, getByRole } = render(App)
      await fireEvent.input(getByLabelText(/^date$/i), { target: { value: '2026-06-22' } })
      await fireEvent.input(getByLabelText(/^session start$/i), { target: { value: '1100' } })
      await fireEvent.input(getByLabelText(/^session end$/i), { target: { value: '1300' } })
      await fireEvent.click(getByRole('button', { name: /add session/i }))

      expect(loadEvents()).toHaveLength(2) // original pair, no new events
      const alerts = document.querySelectorAll('[role=alert]')
      expect(Array.from(alerts).some(a => /overlap/i.test(a.textContent ?? ''))).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders an Analysis section, collapsed by default', () => {
    const { getByText } = render(App)
    const summary = getByText(/^analysis$/i)
    const details = summary.closest('details')!
    expect(details.open).toBe(false)
  })

  it('renders a 24-week chart in the Analysis section', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed Jun 24
    try {
      // Targets effective in Jan so all 24 weeks of the chart have targets.
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          {
            type: 'WorkTargetsSet', id: 't', at: 1,
            effectiveFrom: new Date(2026, 0, 1).getTime(),
            targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
          },
        ]),
      )
      const { getByTestId } = render(App)
      const chart = getByTestId('budget-chart')
      expect(chart.tagName).toBe('svg')
      expect(chart.querySelectorAll('rect[data-testid=chart-bar]')).toHaveLength(24)
      expect(chart.querySelectorAll('polyline[data-testid=chart-line]')).toHaveLength(1)
      const line = chart.querySelector('polyline[data-testid=chart-line]')!
      const pointCount = (line.getAttribute('points') ?? '').trim().split(/\s+/).length
      expect(pointCount).toBe(24)
      expect(chart.querySelectorAll('text[data-testid=x-tick]')).toHaveLength(24)
      expect(chart.querySelectorAll('line[data-testid=gridline]').length).toBeGreaterThanOrEqual(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('lists past days with |worked-target| > 2h30m in the Analysis section', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed
    try {
      const monStart = new Date(2026, 5, 22, 0, 0, 0).getTime() // Mon this week
      const tueStart = new Date(2026, 5, 23, 0, 0, 0).getTime() // Tue this week
      // Targets effective Monday this week so the walk only covers Mon and Tue.
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          {
            type: 'WorkTargetsSet', id: 't', at: 1, effectiveFrom: monStart,
            targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
          },
          // Mon: worked 11h vs target 8h → +3h (outlier).
          { type: 'WorkStarted', id: 'a', at: monStart + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'b', at: monStart + 20 * 3600_000 },
          // Tue: worked 10h vs target 8h → +2h (NOT outlier — threshold is strictly >2h30m).
          { type: 'WorkStarted', id: 'c', at: tueStart + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'd', at: tueStart + 19 * 3600_000 },
        ]),
      )
      const { getByTestId } = render(App)
      const items = getByTestId('analysis-outliers').querySelectorAll('li')
      expect(items).toHaveLength(1)
      expect(items[0].textContent).toMatch(/2026-06-22/)
      expect(items[0].textContent).toMatch(/\+03:00/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows an empty-state message when there are no outliers', () => {
    const { getByText } = render(App)
    const summary = getByText(/^analysis$/i)
    const details = summary.closest('details')!
    expect(details.textContent).toMatch(/no past days/i)
  })

  it('shows a flex budget of +00:00 when no targets are set', () => {
    const { getByTestId } = render(App)
    expect(getByTestId('flex-budget').textContent).toBe('+00:00')
  })

  it('renders a collapsible Flex time section, collapsed by default', () => {
    const { getByText } = render(App)
    const summary = getByText(/flex time/i)
    const details = summary.closest('details')!
    expect(details.open).toBe(false)
  })

  it('persists a WorkTargetsSet event on Save and updates the budget', async () => {
    // Today: Wed 2026-06-24, noon
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0))
    try {
      const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
      const wedMorning = today + 9 * 3600_000
      const wedStop = today + 11 * 3600_000 // 2h worked
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'a', at: wedMorning },
          { type: 'WorkStopped', id: 'b', at: wedStop },
        ]),
      )

      const { getByLabelText, getByRole, getByTestId } = render(App)
      await fireEvent.input(getByLabelText('Mo'), { target: { value: '0800' } })
      await fireEvent.input(getByLabelText('Tu'), { target: { value: '0800' } })
      await fireEvent.input(getByLabelText('We'), { target: { value: '0800' } })
      await fireEvent.input(getByLabelText('Th'), { target: { value: '0800' } })
      await fireEvent.input(getByLabelText('Fr'), { target: { value: '0800' } })
      await fireEvent.input(getByLabelText(/effective from/i), { target: { value: '2026-06-24' } })
      await fireEvent.click(getByRole('button', { name: /save targets/i }))

      const stored = loadEvents().filter(e => e.type === 'WorkTargetsSet')
      expect(stored).toHaveLength(1)
      expect(getByTestId('flex-budget').textContent).toBe('-06:00') // 2h worked - 8h target
    } finally {
      vi.useRealTimers()
    }
  })

  it('increases the flex budget via the adjust form', async () => {
    const { getByLabelText, getByRole, getByTestId } = render(App)
    await fireEvent.input(getByLabelText(/amount/i), { target: { value: '0300' } })
    await fireEvent.input(getByLabelText(/^reason$/i), { target: { value: 'TOIL' } })
    await fireEvent.click(getByRole('button', { name: /^increase$/i }))

    expect(getByTestId('flex-budget').textContent).toBe('+03:00')
    const adjusted = loadEvents().filter(e => e.type === 'FlexAdjusted')
    expect(adjusted).toHaveLength(1)
    expect((adjusted[0] as any).deltaMs).toBe(3 * 3600_000)
    expect((adjusted[0] as any).reason).toBe('TOIL')
  })

  it('decreases the flex budget via the adjust form', async () => {
    const { getByLabelText, getByRole, getByTestId } = render(App)
    await fireEvent.input(getByLabelText(/amount/i), { target: { value: '0030' } })
    await fireEvent.click(getByRole('button', { name: /^decrease$/i }))

    expect(getByTestId('flex-budget').textContent).toBe('-00:30')
    const adjusted = loadEvents().filter(e => e.type === 'FlexAdjusted')
    expect((adjusted[0] as any).deltaMs).toBe(-30 * 60_000)
  })

  it('lists past adjustments under the form, newest first', () => {
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'FlexAdjusted', id: 'a1', at: 1000, deltaMs: 3 * 3600_000, reason: 'TOIL' },
        { type: 'FlexAdjusted', id: 'a2', at: 2000, deltaMs: -30 * 60_000, reason: 'oops' },
      ]),
    )
    const { getByTestId } = render(App)
    const items = getByTestId('adjustment-history').querySelectorAll('li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toMatch(/-00:30/)
    expect(items[0].textContent).toMatch(/oops/)
    expect(items[1].textContent).toMatch(/\+03:00/)
    expect(items[1].textContent).toMatch(/TOIL/)
  })

  it('deletes an adjustment when its Delete button is clicked', async () => {
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'FlexAdjusted', id: 'a1', at: 1000, deltaMs: 3 * 3600_000, reason: 'TOIL' },
      ]),
    )
    const { getByTestId } = render(App)
    expect(getByTestId('flex-budget').textContent).toBe('+03:00')

    const deleteBtn = getByTestId('adjustment-history').querySelector('button')!
    await fireEvent.click(deleteBtn)

    expect(loadEvents().filter(e => e.type === 'FlexAdjusted')).toHaveLength(0)
    expect(getByTestId('flex-budget').textContent).toBe('+00:00')
  })

  it('creates a TargetOverride event via the override form', async () => {
    const { getByLabelText, getByRole } = render(App)
    await fireEvent.input(getByLabelText(/^from$/i), { target: { value: '2026-12-24' } })
    await fireEvent.input(getByLabelText(/^to$/i), { target: { value: '2026-12-26' } })
    await fireEvent.input(getByLabelText(/^target$/i), { target: { value: '0000' } })
    await fireEvent.input(getByLabelText(/override reason/i), { target: { value: 'holiday' } })
    await fireEvent.click(getByRole('button', { name: /apply override/i }))

    const overrides = loadEvents().filter(e => e.type === 'TargetOverride')
    expect(overrides).toHaveLength(1)
    const o = overrides[0] as any
    expect(o.startDay).toBe(new Date(2026, 11, 24).getTime())
    expect(o.endDay).toBe(new Date(2026, 11, 26).getTime())
    expect(o.targetMin).toBe(0)
    expect(o.reason).toBe('holiday')
  })

  it('rejects an override where end is before start', async () => {
    const { getByLabelText, getByRole } = render(App)
    await fireEvent.input(getByLabelText(/^from$/i), { target: { value: '2026-12-26' } })
    await fireEvent.input(getByLabelText(/^to$/i), { target: { value: '2026-12-24' } })
    await fireEvent.input(getByLabelText(/^target$/i), { target: { value: '0000' } })
    await fireEvent.click(getByRole('button', { name: /apply override/i }))

    expect(loadEvents().filter(e => e.type === 'TargetOverride')).toHaveLength(0)
    const alerts = document.querySelectorAll('[role=alert]')
    expect(Array.from(alerts).some(a => /end .* start|start .* end|range/i.test(a.textContent ?? ''))).toBe(true)
  })

  it('lists overrides by start date (most recent first), regardless of emission order', async () => {
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        // Emitted second, but covers an earlier date.
        { type: 'TargetOverride', id: 'jan', at: 2000, startDay: new Date(2026, 0, 1).getTime(), endDay: new Date(2026, 0, 1).getTime(), targetMin: 0, reason: 'new year' },
        // Emitted first, covers a later date.
        { type: 'TargetOverride', id: 'may', at: 1000, startDay: new Date(2026, 4, 1).getTime(), endDay: new Date(2026, 4, 3).getTime(), targetMin: 240, reason: 'short days' },
      ]),
    )
    const { getByTestId } = render(App)
    const items = getByTestId('overrides-history').querySelectorAll('li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toMatch(/2026-05-01/) // by startDay, May wins
    expect(items[1].textContent).toMatch(/2026-01-01/)

    await fireEvent.click(items[0].querySelector('button') as HTMLButtonElement)
    expect(loadEvents().filter(e => e.type === 'TargetOverride')).toHaveLength(1)
  })

  it('shows an error for invalid HHMM in the adjust form', async () => {
    const { getByLabelText, getByRole } = render(App)
    await fireEvent.input(getByLabelText(/amount/i), { target: { value: 'abcd' } })
    await fireEvent.click(getByRole('button', { name: /^increase$/i }))

    expect(loadEvents().filter(e => e.type === 'FlexAdjusted')).toHaveLength(0)
    const alerts = document.querySelectorAll('[role=alert]')
    expect(Array.from(alerts).some(a => /hhmm/i.test(a.textContent ?? ''))).toBe(true)
  })

  it('renders Today, This week, and Previous weeks sections', () => {
    const { getByText } = render(App)
    expect(getByText('Today', { selector: 'h2' })).toBeTruthy()
    expect(getByText('This week', { selector: 'h2' })).toBeTruthy()
    expect(getByText('Previous weeks', { selector: 'h2' })).toBeTruthy()
  })

  it('shows the today delta when a target is active', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed
    try {
      const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'b', at: today + 11 * 3600_000 }, // 2h worked
          {
            type: 'WorkTargetsSet',
            id: 't',
            at: 1,
            effectiveFrom: today,
            targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
          },
        ]),
      )
      const { getByTestId } = render(App)
      expect(getByTestId('today-delta').textContent).toBe('-06:00')
    } finally {
      vi.useRealTimers()
    }
  })

  it('omits the today delta when no target is active', () => {
    const { queryByTestId } = render(App)
    expect(queryByTestId('today-delta')).toBeNull()
  })

  it('shows this week\'s total and per-past-day details', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed
    try {
      const tue = new Date(2026, 5, 23, 0, 0, 0).getTime()
      const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'tA', at: tue + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'tB', at: tue + 17 * 3600_000 }, // 8h
          { type: 'WorkStarted', id: 'wA', at: today + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'wB', at: today + 11 * 3600_000 }, // 2h
        ]),
      )
      const { getByText, getByTestId } = render(App)
      const week = getByText('This week', { selector: 'h2' }).closest('section')!
      expect(getByTestId('week-total').textContent).toBe('10:00')

      const tueDetails = week.querySelector(`details[data-day-start="${tue}"]`) as HTMLDetailsElement
      expect(tueDetails).toBeTruthy()
      expect(tueDetails.querySelector('summary')!.textContent).toMatch(/08:00/)
      expect(tueDetails.querySelectorAll('li')).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('formats Previous weeks sessions as "Wd DD HH:MM - HH:MM (HH:MM)"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed
    try {
      const lastTue = new Date(2026, 5, 16, 0, 0, 0).getTime() // Tue prev week
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'a', at: lastTue + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'b', at: lastTue + 13 * 3600_000 + 15 * 60_000 }, // 4h15m
        ]),
      )
      const { getByText } = render(App)
      const prev = getByText('Previous weeks', { selector: 'h2' }).closest('section')!
      const li = prev.querySelector('li')!
      expect(li.textContent).toMatch(/Tu 16 09:00 - 13:15 \(04:15\)/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('Previous weeks summary uses W## prefix, day numbers, and Hh:Mm total', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed
    try {
      const lastMon = new Date(2026, 5, 15, 0, 0, 0).getTime()
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'a', at: lastMon + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'b', at: lastMon + 17 * 3600_000 + 37 * 60_000 }, // 8h37m
        ]),
      )
      const { getByText } = render(App)
      const prev = getByText('Previous weeks', { selector: 'h2' }).closest('section')!
      const sum = prev.querySelector('details summary')!.textContent ?? ''
      // ISO week of Mon 2026-06-15 is W25.
      expect(sum).toContain('W25')
      // Mon's day is 15
      expect(sum).toContain('15')
      // Total format 8h37m
      expect(sum).toContain('8h37m')
    } finally {
      vi.useRealTimers()
    }
  })

  it('Previous weeks summary inserts month abbrev for day-of-month 01', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0))
    try {
      // Week of Mon Mar 30 2026 spans Mar/Apr; Apr 01 falls on Wed.
      const monMar30 = new Date(2026, 2, 30, 0, 0, 0).getTime()
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'a', at: monMar30 + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'b', at: monMar30 + 17 * 3600_000 },
        ]),
      )
      const { getByText } = render(App)
      const prev = getByText('Previous weeks', { selector: 'h2' }).closest('section')!
      const matching = Array.from(prev.querySelectorAll('details summary')).find(s => /W14/.test(s.textContent ?? ''))!
      const text = matching.textContent ?? ''
      // Mo 30, Tu 31, We Apr (replacing "01"), Th 02, Fr 03
      expect(text).toMatch(/30\s+31\s+Apr\s+02\s+03/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('Previous weeks day numbers are colorised by delta and override', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0))
    try {
      const lastMon = new Date(2026, 5, 15, 0, 0, 0).getTime()
      const lastTue = new Date(2026, 5, 16, 0, 0, 0).getTime()
      const lastFri = new Date(2026, 5, 19, 0, 0, 0).getTime()
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          {
            type: 'WorkTargetsSet', id: 't', at: 1, effectiveFrom: lastMon,
            targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
          },
          // Mon: 10h worked, 8h target → positive
          { type: 'WorkStarted', id: 'mA', at: lastMon + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'mB', at: lastMon + 19 * 3600_000 },
          // Tue: 4h worked, 8h target → negative
          { type: 'WorkStarted', id: 'tA', at: lastTue + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'tB', at: lastTue + 13 * 3600_000 },
          // Fri: target overridden (holiday)
          { type: 'TargetOverride', id: 'o', at: 2, startDay: lastFri, endDay: lastFri, targetMin: 0, reason: 'hols' },
        ]),
      )
      const { getByText } = render(App)
      const prev = getByText('Previous weeks', { selector: 'h2' }).closest('section')!
      const sum = prev.querySelector('details summary')!
      const dayItems = Array.from(sum.querySelectorAll('[data-day-item]')) as HTMLElement[]
      expect(dayItems).toHaveLength(5) // Mo-Fr
      expect(dayItems[0].style.color).toBe('seagreen') // Mon positive
      expect(dayItems[1].style.color).toBe('crimson')  // Tue negative
      expect(dayItems[4].style.color).toBe('steelblue') // Fri override
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not prefix today\'s sessions with the weekday code', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0))
    try {
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
        ]),
      )
      const { getByText } = render(App)
      const todaySection = getByText('Today', { selector: 'h2' }).closest('section')!
      const li = todaySection.querySelector('li')!
      expect(li.textContent?.trim().startsWith('We')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('groups previous-week sessions under details, newest week first', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed
    try {
      const last1Wed = new Date(2026, 5, 17, 0, 0, 0).getTime()
      const last2Wed = new Date(2026, 5, 10, 0, 0, 0).getTime()
      const last1Mon = new Date(2026, 5, 15, 0, 0, 0).getTime()
      const last2Mon = new Date(2026, 5, 8, 0, 0, 0).getTime()
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: '1a', at: last2Wed + 9 * 3600_000 },
          { type: 'WorkStopped', id: '1b', at: last2Wed + 17 * 3600_000 },
          { type: 'WorkStarted', id: '2a', at: last1Wed + 9 * 3600_000 },
          { type: 'WorkStopped', id: '2b', at: last1Wed + 17 * 3600_000 },
        ]),
      )
      const { getByText } = render(App)
      const prev = getByText('Previous weeks', { selector: 'h2' }).closest('section')!
      const weeks = prev.querySelectorAll('details')
      expect(weeks).toHaveLength(2)
      expect(weeks[0].getAttribute('data-week-start')).toBe(String(last1Mon))
      expect(weeks[1].getAttribute('data-week-start')).toBe(String(last2Mon))
      expect(weeks[0].querySelector('summary')!.textContent).toMatch(/8h00m/)
      expect(weeks[0].querySelectorAll('li')).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows weekly delta on previous weeks when targets cover them', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed
    try {
      const lastMon = new Date(2026, 5, 15, 0, 0, 0).getTime()
      const lastWed = lastMon + 2 * 24 * 3600_000
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'a', at: lastWed + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'b', at: lastWed + 17 * 3600_000 }, // 8h
          {
            type: 'WorkTargetsSet',
            id: 't',
            at: 1,
            effectiveFrom: lastMon,
            targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
          },
        ]),
      )
      const { getByText } = render(App)
      const prev = getByText('Previous weeks', { selector: 'h2' }).closest('section')!
      const weeks = prev.querySelectorAll('details')
      expect(weeks).toHaveLength(1)
      // 8h worked - 40h target = -32h
      expect(weeks[0].querySelector('summary')!.textContent).toMatch(/-32:00/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('omits the weekly delta when no targets are active', () => {
    const { queryByTestId } = render(App)
    expect(queryByTestId('week-delta')).toBeNull()
  })

  it('shows weekly delta and per-day deltas when targets exist', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0)) // Wed
    try {
      const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
      const tue = today - 24 * 3600_000
      const monStart = new Date(2026, 5, 22, 0, 0, 0).getTime() // Mon
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([
          { type: 'WorkStarted', id: 'tA', at: tue + 9 * 3600_000 },
          { type: 'WorkStopped', id: 'tB', at: tue + 17 * 3600_000 }, // 8h Tue
          {
            type: 'WorkTargetsSet',
            id: 'tg',
            at: 1,
            effectiveFrom: monStart,
            targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
          },
        ]),
      )
      const { getByTestId, getByText } = render(App)
      // Week total = 8h Tue + 0h today = 8h
      // Week target = 5 * 8h = 40h, delta = -32h
      expect(getByTestId('week-total').textContent).toBe('08:00')
      expect(getByTestId('week-delta').textContent).toBe('-32:00')

      // Tue's day delta: 8h worked - 8h target = 00:00
      const week = getByText('This week', { selector: 'h2' }).closest('section')!
      const tueDetails = week.querySelector(`details[data-day-start="${tue}"]`) as HTMLDetailsElement
      expect(tueDetails.querySelector('summary')!.textContent).toMatch(/[+\-]00:00/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('lists only today\'s sessions in the Today section', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    const lastWeek = today - 7 * 24 * 3600_000
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'old-a', at: lastWeek + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'old-b', at: lastWeek + 10 * 3600_000 },
        { type: 'WorkStarted', id: 'today-a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'today-b', at: today + 10 * 3600_000 },
      ]),
    )
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0))
    try {
      const { getByText } = render(App)
      const todaySection = getByText('Today', { selector: 'h2' }).closest('section')!
      const items = todaySection.querySelectorAll('li')
      expect(items).toHaveLength(1)
      expect(items[0].textContent).toMatch(/09:00/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('lists all target sets, newest effectiveFrom first', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        {
          type: 'WorkTargetsSet',
          id: 'jan',
          at: 1,
          effectiveFrom: new Date(2026, 0, 1).getTime(),
          targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
        },
        {
          type: 'WorkTargetsSet',
          id: 'apr',
          at: 2,
          effectiveFrom: new Date(2026, 3, 1).getTime(),
          targets: { Mo: 510, Tu: 480, We: 0, Th: 480, Fr: 240 },
        },
      ]),
    )
    const { getByTestId } = render(App)
    const items = getByTestId('targets-history').querySelectorAll('li')
    expect(items).toHaveLength(2)
    // Newest first.
    expect(items[0].textContent).toMatch(/2026-04-01/)
    expect(items[0].textContent).toMatch(/Mo.*0830/)
    expect(items[1].textContent).toMatch(/2026-01-01/)
    expect(items[1].textContent).toMatch(/Mo.*0800/)
  })

  it('shows weekly total per target set row', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    // 510 + 480 + 0 + 480 + 240 = 1710 min = 28h30m
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        {
          type: 'WorkTargetsSet',
          id: 't',
          at: 1,
          effectiveFrom: today,
          targets: { Mo: 510, Tu: 480, We: 0, Th: 480, Fr: 240 },
        },
      ]),
    )
    const { getByTestId } = render(App)
    const item = getByTestId('targets-history').querySelector('li')!
    expect(item.textContent).toMatch(/28:30/)
  })

  it('deletes a target set via its Delete button', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        {
          type: 'WorkTargetsSet',
          id: 'old',
          at: 1,
          effectiveFrom: today - 30 * 24 * 3600_000,
          targets: { Mo: 480, Tu: 480, We: 480, Th: 480, Fr: 480 },
        },
        {
          type: 'WorkTargetsSet',
          id: 'new',
          at: 2,
          effectiveFrom: today,
          targets: { Mo: 240, Tu: 240, We: 240, Th: 240, Fr: 240 },
        },
      ]),
    )
    const { getByTestId } = render(App)
    // First (newest) row should be the 'new' one — delete it.
    const firstRowDelete = getByTestId('targets-history').querySelector('li button') as HTMLButtonElement
    await fireEvent.click(firstRowDelete)

    const remaining = loadEvents().filter(e => e.type === 'WorkTargetsSet')
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('old')
  })

  it('hides the target sets list when none are set', () => {
    const { queryByTestId } = render(App)
    expect(queryByTestId('targets-history')).toBeNull()
  })

  it('prefills the targets form from the currently active target set', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        {
          type: 'WorkTargetsSet',
          id: 't',
          at: 1,
          effectiveFrom: today - 7 * 24 * 3600_000,
          targets: { Mo: 510, Tu: 480, We: 0, Th: 480, Fr: 240 },
        },
      ]),
    )
    const { getByLabelText } = render(App)
    expect((getByLabelText('Mo') as HTMLInputElement).value).toBe('0830')
    expect((getByLabelText('We') as HTMLInputElement).value).toBe('0000')
    expect((getByLabelText('Fr') as HTMLInputElement).value).toBe('0400')
  })

  it('renders a Start button when there are no events', () => {
    const { getByRole } = render(App)
    expect(getByRole('button', { name: /start/i })).toBeTruthy()
  })

  it('appends a WorkStarted event on Start click', async () => {
    const { getByRole } = render(App)
    await fireEvent.click(getByRole('button', { name: /start/i }))

    const events = loadEvents()
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('WorkStarted')
    expect(typeof events[0].at).toBe('number')
  })

  it('shows Stop instead of Start while a session is running', async () => {
    const { getByRole, queryByRole } = render(App)
    await fireEvent.click(getByRole('button', { name: /start/i }))

    expect(queryByRole('button', { name: /start/i })).toBeNull()
    expect(getByRole('button', { name: /stop/i })).toBeTruthy()
  })

  it('appends WorkStopped on Stop click and reverts to Start', async () => {
    const { getByRole, queryByRole } = render(App)
    await fireEvent.click(getByRole('button', { name: /start/i }))
    await fireEvent.click(getByRole('button', { name: /stop/i }))

    const events = loadEvents()
    expect(events.map(e => e.type)).toEqual(['WorkStarted', 'WorkStopped'])
    expect(queryByRole('button', { name: /stop/i })).toBeNull()
    expect(getByRole('button', { name: /start/i })).toBeTruthy()
  })

  it('renders Stop on mount when the last persisted event was WorkStarted', () => {
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([{ type: 'WorkStarted', id: 'x', at: 1 }]),
    )
    const { getByRole } = render(App)
    expect(getByRole('button', { name: /stop/i })).toBeTruthy()
  })

  it("renders today's elapsed time as HH:MM:SS", () => {
    const now = Date.now()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const start = startOfToday.getTime() + 1000
    const stop = start + (1 * 3600 + 2 * 60 + 3) * 1000 // 1h 2m 3s
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: start },
        { type: 'WorkStopped', id: 'b', at: stop },
      ]),
    )
    const { getByTestId } = render(App)
    expect(getByTestId('elapsed-today').textContent).toBe('01:02:03')
  })

  it("renders 00:00:00 elapsed when no sessions exist today", () => {
    const { getByTestId } = render(App)
    expect(getByTestId('elapsed-today').textContent).toBe('00:00:00')
  })

  it('lists sessions newest-first with start and stop times', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 }, // 09:00
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 }, // 10:00
        { type: 'WorkStarted', id: 'c', at: today + 13 * 3600_000 }, // 13:00
        { type: 'WorkStopped', id: 'd', at: today + 14 * 3600_000 }, // 14:00
      ]),
    )
    const { getAllByRole } = render(App)
    const items = getAllByRole('listitem')
    expect(items).toHaveLength(2)
    // Newest first: 13:00–14:00 before 09:00–10:00.
    expect(items[0].textContent).toMatch(/13:00.*14:00/)
    expect(items[1].textContent).toMatch(/09:00.*10:00/)
  })

  it('shows session length (hh:mm) next to completed sessions', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 + 30 * 60_000 },
      ]),
    )
    const { getAllByRole } = render(App)
    const items = getAllByRole('listitem')
    expect(items[0].textContent).toMatch(/01:30/)
  })

  it('shows only the start time for a running session', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
      ]),
    )
    const { getAllByRole } = render(App)
    const items = getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0].textContent).toMatch(/09:00/)
    expect(items[0].textContent).not.toMatch(/—/)
    expect(items[0].querySelectorAll('time')).toHaveLength(1)
  })

  it('shows an Edit button on each completed session', () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
      ]),
    )
    const { getByRole } = render(App)
    expect(getByRole('button', { name: /edit/i })).toBeTruthy()
  })

  it('reveals start and stop datetime inputs prefilled when Edit is clicked', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 + 30 * 60_000 },
      ]),
    )
    const { getByRole, getByLabelText } = render(App)
    await fireEvent.click(getByRole('button', { name: /edit/i }))

    const startInput = getByLabelText(/^start$/i) as HTMLInputElement
    const stopInput = getByLabelText(/^stop$/i) as HTMLInputElement
    expect(startInput.type).toBe('text')
    expect(startInput.value).toBe('0900')
    expect(stopInput.value).toBe('1030')
  })

  it('recomputes session length live as the inputs change', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
      ]),
    )
    const { getByRole, getByLabelText, getByTestId } = render(App)
    expect(getByTestId('session-length').textContent).toBe('01:00')

    await fireEvent.click(getByRole('button', { name: /edit/i }))
    const stopInput = getByLabelText(/^stop$/i) as HTMLInputElement
    await fireEvent.input(stopInput, { target: { value: '1145' } })

    expect(getByTestId('session-length').textContent).toBe('02:45')
  })

  it('persists edited start/stop times when Save is clicked', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
      ]),
    )
    const { getByRole, getByLabelText, queryByLabelText, getAllByRole } = render(App)
    await fireEvent.click(getByRole('button', { name: /edit/i }))

    await fireEvent.input(getByLabelText(/^start$/i), { target: { value: '0830' } })
    await fireEvent.input(getByLabelText(/^stop$/i), { target: { value: '1100' } })
    await fireEvent.click(getByRole('button', { name: /^save$/i }))

    expect(queryByLabelText(/^start$/i)).toBeNull()
    const item = getAllByRole('listitem')[0]
    expect(item.textContent).toMatch(/08:30/)
    expect(item.textContent).toMatch(/11:00/)
    expect(item.textContent).toMatch(/02:30/) // length

    const stored = loadEvents()
    expect(stored[0].at).toBe(new Date(2026, 5, 24, 8, 30).getTime())
    expect(stored[1].at).toBe(new Date(2026, 5, 24, 11, 0).getTime())
  })

  it('shows an error and does not mutate when Save would overlap another session', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    const original = [
      { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
      { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
      { type: 'WorkStarted', id: 'c', at: today + 13 * 3600_000 },
      { type: 'WorkStopped', id: 'd', at: today + 14 * 3600_000 },
    ]
    localStorage.setItem('worktimer.events', JSON.stringify(original))

    const { getAllByRole, getByLabelText, getByRole, getAllByRole: getAll } = render(App)
    // Edit the older session (the 09–10 one) — it's the second listitem (newest-first).
    const items = getAll('listitem')
    await fireEvent.click(items[1].querySelector('button')!)

    // Push its stop past the start of the 13:00 session.
    await fireEvent.input(getByLabelText(/^stop$/i), { target: { value: '1330' } })
    await fireEvent.click(getByRole('button', { name: /^save$/i }))

    expect(getByRole('alert').textContent).toMatch(/overlap/i)
    expect(loadEvents()).toEqual(original)
    expect(getByLabelText(/^stop$/i)).toBeTruthy() // still in edit mode
  })

  it('clears the error after a successful Save', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
        { type: 'WorkStarted', id: 'c', at: today + 13 * 3600_000 },
        { type: 'WorkStopped', id: 'd', at: today + 14 * 3600_000 },
      ]),
    )
    const { getAllByRole, getByLabelText, getByRole, queryByRole } = render(App)
    const items = getAllByRole('listitem')
    await fireEvent.click(items[1].querySelector('button')!)

    await fireEvent.input(getByLabelText(/^stop$/i), { target: { value: '1330' } })
    await fireEvent.click(getByRole('button', { name: /^save$/i }))
    expect(getByRole('alert')).toBeTruthy()

    await fireEvent.input(getByLabelText(/^stop$/i), { target: { value: '1100' } })
    await fireEvent.click(getByRole('button', { name: /^save$/i }))
    expect(queryByRole('alert')).toBeNull()
  })

  it('removes a completed session when Delete is clicked', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
        { type: 'WorkStarted', id: 'c', at: today + 13 * 3600_000 },
        { type: 'WorkStopped', id: 'd', at: today + 14 * 3600_000 },
      ]),
    )
    const { getAllByRole } = render(App)
    const items = getAllByRole('listitem')
    const deleteBtn = Array.from(items[0].querySelectorAll('button')).find(
      b => /delete/i.test(b.textContent ?? ''),
    )!
    await fireEvent.click(deleteBtn)

    expect(getAllByRole('listitem')).toHaveLength(1)
    expect(loadEvents().map(e => e.id)).toEqual(['a', 'b'])
  })

  it('removes a running session when Delete is clicked', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([{ type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 }]),
    )
    const { getByRole, queryAllByRole } = render(App)
    await fireEvent.click(getByRole('button', { name: /delete/i }))

    expect(queryAllByRole('listitem')).toHaveLength(0)
    expect(loadEvents()).toEqual([])
    // Idle state restored: Start button visible.
    expect(getByRole('button', { name: /start/i })).toBeTruthy()
  })

  it('shows a format error when the input is not HHMM', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    const original = [
      { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
      { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
    ]
    localStorage.setItem('worktimer.events', JSON.stringify(original))

    const { getByRole, getByLabelText } = render(App)
    await fireEvent.click(getByRole('button', { name: /edit/i }))
    await fireEvent.input(getByLabelText(/^stop$/i), { target: { value: '11:00' } })
    await fireEvent.click(getByRole('button', { name: /^save$/i }))

    expect(getByRole('alert').textContent).toMatch(/hhmm/i)
    expect(loadEvents()).toEqual(original)
  })

  it('discards edits and exits edit mode on Cancel', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    const original = [
      { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
      { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
    ]
    localStorage.setItem('worktimer.events', JSON.stringify(original))

    const { getByRole, getByLabelText, queryByLabelText } = render(App)
    await fireEvent.click(getByRole('button', { name: /edit/i }))
    await fireEvent.input(getByLabelText(/^start$/i), { target: { value: '0100' } })
    await fireEvent.click(getByRole('button', { name: /cancel/i }))

    expect(queryByLabelText(/^start$/i)).toBeNull()
    expect(loadEvents()).toEqual(original)
  })

  it('clears any prior error when Cancel is clicked', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([
        { type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 },
        { type: 'WorkStopped', id: 'b', at: today + 10 * 3600_000 },
      ]),
    )
    const { getByRole, getByLabelText, queryByRole } = render(App)
    await fireEvent.click(getByRole('button', { name: /edit/i }))
    await fireEvent.input(getByLabelText(/^stop$/i), { target: { value: '0800' } })
    await fireEvent.click(getByRole('button', { name: /^save$/i }))
    expect(getByRole('alert')).toBeTruthy()

    await fireEvent.click(getByRole('button', { name: /cancel/i }))
    await fireEvent.click(getByRole('button', { name: /edit/i }))
    expect(queryByRole('alert')).toBeNull()
  })

  it('lets the user edit the start of a running session (no stop input)', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([{ type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 }]),
    )
    const { getByRole, getByLabelText, queryByLabelText, getAllByRole } = render(App)
    await fireEvent.click(getByRole('button', { name: /edit/i }))

    expect(getByLabelText(/^start$/i)).toBeTruthy()
    expect(queryByLabelText(/^stop$/i)).toBeNull()

    await fireEvent.input(getByLabelText(/^start$/i), { target: { value: '0830' } })
    await fireEvent.click(getByRole('button', { name: /^save$/i }))

    expect(loadEvents()[0].at).toBe(new Date(2026, 5, 24, 8, 30).getTime())
    expect(queryByLabelText(/^start$/i)).toBeNull()
    expect(getAllByRole('listitem')[0].textContent).toMatch(/08:30/)
  })

  it('rejects a running-session start in the future', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 12, 0, 0))
    try {
      const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([{ type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 }]),
      )
      const { getByRole, getByLabelText } = render(App)
      await fireEvent.click(getByRole('button', { name: /edit/i }))
      await fireEvent.input(getByLabelText(/^start$/i), { target: { value: '1500' } })
      await fireEvent.click(getByRole('button', { name: /^save$/i }))

      expect(getByRole('alert').textContent).toMatch(/future/i)
      expect(loadEvents()[0].at).toBe(today + 9 * 3600_000)
    } finally {
      vi.useRealTimers()
    }
  })

  it('populates events when "Load sample data" is clicked', async () => {
    const { getByRole } = render(App)
    expect(loadEvents()).toHaveLength(0)

    await fireEvent.click(getByRole('button', { name: /replace current data with generated/i }))
    expect(loadEvents().length).toBeGreaterThan(50)
  })

  it('replaces events when a JSON file is imported', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([{ type: 'WorkStarted', id: 'old', at: 1 }]),
    )

    const incoming = [
      { type: 'WorkStarted', id: 'new-a', at: today + 9 * 3600_000 },
      { type: 'WorkStopped', id: 'new-b', at: today + 10 * 3600_000 },
    ]
    const file = new File([JSON.stringify(incoming)], 'events.json', { type: 'application/json' })

    const { getByLabelText, findAllByRole } = render(App)
    const input = getByLabelText(/import/i) as HTMLInputElement
    await fireEvent.change(input, { target: { files: [file] } })

    const items = await findAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(loadEvents()).toEqual(incoming)
  })

  it('clears all events when "Clear current data" is clicked', async () => {
    const today = new Date(2026, 5, 24, 0, 0, 0).getTime()
    localStorage.setItem(
      'worktimer.events',
      JSON.stringify([{ type: 'WorkStarted', id: 'a', at: today + 9 * 3600_000 }]),
    )
    const { getByRole } = render(App)
    await fireEvent.click(getByRole('button', { name: /clear current data/i }))
    expect(loadEvents()).toEqual([])
  })

  it('exposes an Export JSON button', () => {
    const { getByRole } = render(App)
    expect(getByRole('button', { name: /export/i })).toBeTruthy()
  })

  it('ticks the elapsed display while a session is running', async () => {
    const now = new Date(2026, 5, 24, 12, 0, 0).getTime()
    vi.useFakeTimers()
    vi.setSystemTime(now)
    try {
      localStorage.setItem(
        'worktimer.events',
        JSON.stringify([{ type: 'WorkStarted', id: 'a', at: now }]),
      )
      const { getByTestId } = render(App)
      expect(getByTestId('elapsed-today').textContent).toBe('00:00:00')

      await vi.advanceTimersByTimeAsync(3000)
      await tick()
      expect(getByTestId('elapsed-today').textContent).toBe('00:00:03')
    } finally {
      vi.useRealTimers()
    }
  })
})
