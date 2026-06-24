import type { WorkEvent } from './events'

export function parseTimeTrackerCsv(text: string, makeId: () => string): WorkEvent[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '')
  if (lines.length === 0) return []

  const [header, ...rows] = lines
  if (!/^time;type;task;text/i.test(header)) {
    throw new Error('expected header "time;type;task;text"')
  }

  type Row = { type: 'WorkStarted' | 'WorkStopped'; at: number }
  const parsed: Row[] = rows.map((line, i) => {
    const [time, kind] = line.split(';')
    const at = new Date(time).getTime()
    if (Number.isNaN(at)) throw new Error(`row ${i + 2}: invalid time ${JSON.stringify(time)}`)
    if (kind === 'in') return { type: 'WorkStarted', at }
    if (kind === 'out') return { type: 'WorkStopped', at }
    throw new Error(`row ${i + 2}: unknown type ${JSON.stringify(kind)}`)
  })

  parsed.sort((a, b) => a.at - b.at)
  return parsed.map(r => ({ ...r, id: makeId() }))
}
