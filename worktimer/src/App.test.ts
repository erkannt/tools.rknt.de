import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
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
})
