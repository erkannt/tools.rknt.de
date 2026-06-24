import type { WorkEvent } from './events'

type Options = {
  today: number
  days: number
  seed: number
  makeId?: () => string
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const HOUR = 3600_000
const MIN = 60_000

type Block = { startHour: number; jitterMin: number; durationMin: number; durationJitter: number }

const blocks: Block[] = [
  { startHour: 9,  jitterMin: 30, durationMin: 180, durationJitter: 30 },
  { startHour: 13, jitterMin: 30, durationMin: 240, durationJitter: 30 },
  { startHour: 19, jitterMin: 20, durationMin: 90,  durationJitter: 30 },
]

export function generateSampleEvents(opts: Options): WorkEvent[] {
  const rand = mulberry32(opts.seed)
  const makeId = opts.makeId ?? (() => crypto.randomUUID())

  const startOfToday = new Date(opts.today)
  startOfToday.setHours(0, 0, 0, 0)

  const events: WorkEvent[] = []
  for (let i = opts.days; i >= 1; i--) {
    const day = new Date(startOfToday)
    day.setDate(day.getDate() - i)
    const weekday = day.getDay()
    if (weekday === 0 || weekday === 6) continue

    const includeEvening = rand() < 0.4
    const dayBlocks = includeEvening ? blocks : blocks.slice(0, 2)

    let prevEnd = 0
    for (const b of dayBlocks) {
      const startJitter = (rand() * 2 - 1) * b.jitterMin * MIN
      const start = day.getTime() + b.startHour * HOUR + startJitter
      const dur = (b.durationMin + (rand() * 2 - 1) * b.durationJitter) * MIN
      const safeStart = Math.max(start, prevEnd + 5 * MIN)
      const stop = safeStart + dur
      events.push({ type: 'WorkStarted', id: makeId(), at: Math.round(safeStart) })
      events.push({ type: 'WorkStopped', id: makeId(), at: Math.round(stop) })
      prevEnd = stop
    }
  }
  return events
}
