import type { ActionEvent } from "./events";

export const BASE_TITLE = "done delay delete";

export type TodayTally = {
  done: number;
  delay: number;
  delete: number;
};

export function tallyToday(events: ActionEvent[], now: number): TodayTally {
  const dayStart = startOfDay(now);
  const tally: TodayTally = { done: 0, delay: 0, delete: 0 };

  for (const event of events) {
    switch (event.type) {
      case "actionDone":
        if (event.doneAt >= dayStart) tally.done += 1;
        break;
      case "actionDelayed":
        if (event.delayedAt >= dayStart) tally.delay += 1;
        break;
      case "actionDeleted":
        if (event.deletedAt >= dayStart) tally.delete += 1;
        break;
      case "actionCreated":
        break;
    }
  }

  return tally;
}

export function titleFor(tally: TodayTally): string {
  if (tally.done + tally.delay + tally.delete === 0) return BASE_TITLE;
  return `done[${tally.done}] delay[${tally.delay}] delete[${tally.delete}]`;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}