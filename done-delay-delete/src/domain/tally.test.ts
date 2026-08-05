import { describe, expect, it } from "vitest";
import type { ActionEvent } from "./events";
import { BASE_TITLE, startOfDay, tallyToday, titleFor } from "./tally";

const NOW = new Date(2026, 7, 5, 14, 30).getTime();
const TODAY_START = startOfDay(NOW);
const YESTERDAY = startOfDay(NOW) - 1;

function created(id: string, createdAt: number): ActionEvent {
  return { type: "actionCreated", id, text: id, createdAt };
}
function done(id: string, doneAt: number): ActionEvent {
  return { type: "actionDone", id, doneAt };
}
function delayed(id: string, delayedAt: number): ActionEvent {
  return { type: "actionDelayed", id, delayedAt, delayUntil: delayedAt + 1000 };
}
function deleted(id: string, deletedAt: number): ActionEvent {
  return { type: "actionDeleted", id, deletedAt };
}

describe("tallyToday", () => {
  it("counts done, delayed and deleted actions from today", () => {
    const events = [
      created("a", TODAY_START + 1000),
      done("a", TODAY_START + 2000),
      done("b", TODAY_START + 3000),
      delayed("c", TODAY_START + 4000),
      deleted("d", TODAY_START + 5000),
    ];
    expect(tallyToday(events, NOW)).toEqual({ done: 2, delay: 1, delete: 1 });
  });

  it("ignores actions from earlier days and actionCreated events", () => {
    const events = [
      created("a", YESTERDAY),
      done("a", YESTERDAY),
      delayed("b", YESTERDAY),
      deleted("c", YESTERDAY),
      done("d", TODAY_START),
    ];
    expect(tallyToday(events, NOW)).toEqual({ done: 1, delay: 0, delete: 0 });
  });

  it("returns all zeros when nothing happened today", () => {
    expect(tallyToday([], NOW)).toEqual({ done: 0, delay: 0, delete: 0 });
  });
});

describe("titleFor", () => {
  it("returns the base title when nothing was done today", () => {
    expect(titleFor({ done: 0, delay: 0, delete: 0 })).toBe(BASE_TITLE);
  });

  it("formats the tally in the page title", () => {
    expect(titleFor({ done: 1, delay: 0, delete: 2 })).toBe(
      "done[1] delay[0] delete[2]",
    );
  });
});
