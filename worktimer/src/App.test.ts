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

    const startInput = getByLabelText(/start/i) as HTMLInputElement
    const stopInput = getByLabelText(/stop/i) as HTMLInputElement
    expect(startInput.type).toBe('datetime-local')
    expect(startInput.value).toBe('2026-06-24T09:00')
    expect(stopInput.value).toBe('2026-06-24T10:30')
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
    const stopInput = getByLabelText(/stop/i) as HTMLInputElement
    await fireEvent.input(stopInput, { target: { value: '2026-06-24T11:45' } })

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

    await fireEvent.input(getByLabelText(/start/i), { target: { value: '2026-06-24T08:30' } })
    await fireEvent.input(getByLabelText(/stop/i), { target: { value: '2026-06-24T11:00' } })
    await fireEvent.click(getByRole('button', { name: /save/i }))

    expect(queryByLabelText(/start/i)).toBeNull()
    const item = getAllByRole('listitem')[0]
    expect(item.textContent).toMatch(/08:30/)
    expect(item.textContent).toMatch(/11:00/)
    expect(item.textContent).toMatch(/02:30/) // length

    const stored = loadEvents()
    expect(stored[0].at).toBe(new Date('2026-06-24T08:30').getTime())
    expect(stored[1].at).toBe(new Date('2026-06-24T11:00').getTime())
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
    await fireEvent.input(getByLabelText(/stop/i), { target: { value: '2026-06-24T13:30' } })
    await fireEvent.click(getByRole('button', { name: /save/i }))

    expect(getByRole('alert').textContent).toMatch(/overlap/i)
    expect(loadEvents()).toEqual(original)
    expect(getByLabelText(/stop/i)).toBeTruthy() // still in edit mode
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

    await fireEvent.input(getByLabelText(/stop/i), { target: { value: '2026-06-24T13:30' } })
    await fireEvent.click(getByRole('button', { name: /save/i }))
    expect(getByRole('alert')).toBeTruthy()

    await fireEvent.input(getByLabelText(/stop/i), { target: { value: '2026-06-24T11:00' } })
    await fireEvent.click(getByRole('button', { name: /save/i }))
    expect(queryByRole('alert')).toBeNull()
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
    await fireEvent.input(getByLabelText(/start/i), { target: { value: '2026-06-24T01:00' } })
    await fireEvent.click(getByRole('button', { name: /cancel/i }))

    expect(queryByLabelText(/start/i)).toBeNull()
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
    await fireEvent.input(getByLabelText(/stop/i), { target: { value: '2026-06-24T08:00' } })
    await fireEvent.click(getByRole('button', { name: /save/i }))
    expect(getByRole('alert')).toBeTruthy()

    await fireEvent.click(getByRole('button', { name: /cancel/i }))
    await fireEvent.click(getByRole('button', { name: /edit/i }))
    expect(queryByRole('alert')).toBeNull()
  })

  it('populates events when "Load sample data" is clicked', async () => {
    const { getByRole, queryAllByRole, findAllByRole } = render(App)
    expect(queryAllByRole('listitem')).toHaveLength(0)

    await fireEvent.click(getByRole('button', { name: /load sample/i }))
    const items = await findAllByRole('listitem')
    expect(items.length).toBeGreaterThan(5)
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
