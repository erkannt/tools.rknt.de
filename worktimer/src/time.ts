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
