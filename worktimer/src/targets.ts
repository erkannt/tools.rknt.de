import type { Targets, WorkEvent } from './events'

export function activeTargets(events: WorkEvent[], day: number): Targets | null {
  let chosen: Targets | null = null
  let chosenFrom = -Infinity
  for (const ev of events) {
    if (ev.type !== 'WorkTargetsSet') continue
    if (ev.effectiveFrom > day) continue
    if (ev.effectiveFrom >= chosenFrom) {
      chosen = ev.targets
      chosenFrom = ev.effectiveFrom
    }
  }
  return chosen
}
