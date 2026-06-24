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
})
