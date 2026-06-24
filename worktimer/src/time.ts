export function parseHHMM(input: string, dateAnchor: number): number | null {
  if (!/^\d{4}$/.test(input)) return null
  const hh = Number(input.slice(0, 2))
  const mm = Number(input.slice(2, 4))
  if (hh > 23 || mm > 59) return null
  const d = new Date(dateAnchor)
  d.setHours(hh, mm, 0, 0)
  return d.getTime()
}

export function formatHHMM(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// Next local midnight. Uses setDate so DST transitions land on the actual
// local midnight (e.g. 24h *isn't* added when the clock springs forward).
export function nextDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  return d.getTime()
}

// ISO 8601 week label, e.g. "2026-W25". Week 1 is the week containing the
// first Thursday of the year; week numbers reset at the Mon-Sun boundary.
export function isoWeekLabel(t: number): string {
  const d = new Date(t)
  // Thursday of this week determines the ISO week-year.
  const thursday = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayNum = (thursday.getDay() + 6) % 7 // Mon=0..Sun=6
  thursday.setDate(thursday.getDate() - dayNum + 3)
  const isoYear = thursday.getFullYear()
  const jan4 = new Date(isoYear, 0, 4)
  const jan4DayNum = (jan4.getDay() + 6) % 7
  const week1Monday = new Date(isoYear, 0, 4 - jan4DayNum)
  const week = Math.round((thursday.getTime() - week1Monday.getTime()) / (7 * 86400_000)) + 1
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}
