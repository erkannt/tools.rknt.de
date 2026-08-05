import { describe, expect, it } from "vitest";
import {
  createAction,
  deleteAction,
  delayAction,
  markDone,
} from "./commands";
import { HOUR_MS } from "./delay";
import type { ActionEvent } from "./events";
import { project } from "./projection";

const NOW = 1_000_000;
let counter = 0;
const newId = () => `id-${counter++}`;

function stateFor(events: ActionEvent[]) {
  return project(events, NOW);
}

describe("createAction", () => {
  it("returns an actionCreated event with trimmed text", () => {
    const event = createAction("  buy milk  ", NOW, newId);
    expect(event).toEqual({
      type: "actionCreated",
      id: "id-0",
      text: "buy milk",
      createdAt: NOW,
    });
  });

  it("returns null for empty or whitespace-only text", () => {
    expect(createAction("", NOW, newId)).toBeNull();
    expect(createAction("   ", NOW, newId)).toBeNull();
  });
});

describe("markDone", () => {
  it("returns an actionDone event for an available action", () => {
    const event = markDone(stateFor([created("a")]), "a", NOW);
    expect(event).toEqual({ type: "actionDone", id: "a", doneAt: NOW });
  });

  it("is inert for unknown id", () => {
    expect(markDone(stateFor([]), "nope", NOW)).toBeNull();
  });

  it("is inert for a non-available action", () => {
    const delayedEvent = { type: "actionDelayed" as const, id: "a", delayedAt: NOW, delayUntil: NOW + 10 * HOUR_MS };
    expect(markDone(stateFor([created("a"), delayedEvent]), "a", NOW)).toBeNull();
    expect(markDone(stateFor([created("a"), doneE("a")]), "a", NOW)).toBeNull();
    expect(markDone(stateFor([created("a"), delE("a")]), "a", NOW)).toBeNull();
  });
});

describe("delayAction", () => {
  it("returns a delayed event with showAt = now + fibonacci(1) x 6h for first delay", () => {
    const event = delayAction(stateFor([created("a")]), "a", NOW);
    expect(event).toEqual({
      type: "actionDelayed",
      id: "a",
      delayedAt: NOW,
      delayUntil: NOW + 6 * HOUR_MS,
    });
  });

  it("escalates the delay with each prior delay", () => {
    const first = {
      type: "actionDelayed" as const,
      id: "a",
      delayedAt: NOW,
      delayUntil: NOW + 6 * HOUR_MS,
    };
    const second = {
      type: "actionDelayed" as const,
      id: "a",
      delayedAt: NOW + 6 * HOUR_MS,
      delayUntil: NOW + 12 * HOUR_MS,
    };

    expect(delayAction(stateFor([created("a"), first]), "a", NOW)).toBeNull();

    const state = project([created("a"), first, second], NOW + 12 * HOUR_MS);
    expect(state.actions[0].numberOfDelays).toBe(2);
    expect(delayAction(state, "a", NOW + 12 * HOUR_MS)?.delayUntil).toBe(
      NOW + 24 * HOUR_MS,
    );
  });

  it("is inert for unknown or non-available ids", () => {
    expect(delayAction(stateFor([]), "nope", NOW)).toBeNull();
    expect(delayAction(stateFor([created("a"), doneE("a")]), "a", NOW)).toBeNull();
  });
});

describe("deleteAction", () => {
  it("returns an actionDeleted event for an available action", () => {
    const event = deleteAction(stateFor([created("a")]), "a", NOW);
    expect(event).toEqual({ type: "actionDeleted", id: "a", deletedAt: NOW });
  });

  it("is inert for unknown or non-available ids", () => {
    expect(deleteAction(stateFor([]), "nope", NOW)).toBeNull();
    expect(deleteAction(stateFor([created("a"), doneE("a")]), "a", NOW)).toBeNull();
  });
});

function created(id: string): ActionEvent {
  return { type: "actionCreated", id, text: id, createdAt: NOW };
}
function doneE(id: string): ActionEvent {
  return { type: "actionDone", id, doneAt: NOW };
}
function delE(id: string): ActionEvent {
  return { type: "actionDeleted", id, deletedAt: NOW };
}