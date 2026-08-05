import { describe, expect, it } from "vitest";
import type { ActionEvent } from "./events";
import {
  LANDING_SIZE,
  availableActions,
  delayedActions,
  landingActions,
  project,
} from "./projection";

const NOW = 1_000_000;
const HOUR = 60 * 60 * 1000;

function created(id: string, text: string, createdAt: number): ActionEvent {
  return { type: "actionCreated", id, text, createdAt };
}
function delayed(id: string, until: number): ActionEvent {
  return { type: "actionDelayed", id, delayedAt: NOW, delayUntil: until };
}
function done(id: string): ActionEvent {
  return { type: "actionDone", id, doneAt: NOW };
}
function deleted(id: string): ActionEvent {
  return { type: "actionDeleted", id, deletedAt: NOW };
}

describe("project", () => {
  it("empty log yields no actions", () => {
    expect(project([], NOW).actions).toEqual([]);
  });

  it("newly created action is available with showAt = createdAt", () => {
    const state = project([created("a", "buy milk", NOW)], NOW);
    expect(availableActions(state)).toHaveLength(1);
    const a = state.actions[0];
    expect(a).toMatchObject({
      id: "a",
      text: "buy milk",
      status: "available",
      showAt: NOW,
      numberOfDelays: 0,
    });
  });

  it("delayed action with future showAt is unavailable to the landing", () => {
    const events = [created("a", "buy milk", NOW), delayed("a", NOW + 6 * HOUR)];
    const state = project(events, NOW);
    expect(delayedActions(state)).toHaveLength(1);
    expect(availableActions(state)).toHaveLength(0);
    expect(state.actions[0].showAt).toBe(NOW + 6 * HOUR);
  });

  it("delayed action becomes available again once its showAt passes", () => {
    const events = [created("a", "buy milk", NOW), delayed("a", NOW + 6 * HOUR)];
    const state = project(events, NOW + 6 * HOUR);
    expect(state.actions[0].status).toBe("available");
  });

  it("done action is removed from availability", () => {
    const state = project(
      [created("a", "buy milk", NOW), done("a")],
      NOW,
    );
    expect(state.actions[0].status).toBe("done");
    expect(availableActions(state)).toHaveLength(0);
  });

  it("deleted action is removed from availability", () => {
    const state = project(
      [created("a", "buy milk", NOW), deleted("a")],
      NOW,
    );
    expect(state.actions[0].status).toBe("deleted");
    expect(availableActions(state)).toHaveLength(0);
  });

  it("counts prior delays", () => {
    const events = [
      created("a", "buy milk", NOW),
      delayed("a", NOW + 6 * HOUR),
      delayed("a", NOW + 12 * HOUR),
    ];
    const state = project(events, NOW);
    expect(state.actions[0].numberOfDelays).toBe(2);
  });
});

describe("queue ordering and landing", () => {
  it("orders available actions by showAt ascending", () => {
    const state = project(
      [
        created("a", "older", 100),
        created("b", "newer", 200),
        created("c", "recent", 300),
      ],
      NOW,
    );
    expect(availableActions(state).map((a) => a.id)).toEqual(["a", "b", "c"]);
  });

  it("puts a delayed-but-lapsed action behind never-delayed ones by its showAt", () => {
    const state = project(
      [
        created("a", "old", 100),
        created("b", "delayed", 500),
        delayed("b", 300),
      ],
      NOW,
    );
    // b's showAt (300) is still before a's createdAt(100)? no -> a(100) < b(300)
    expect(availableActions(state).map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("landing shows LANDING_SIZE actions", () => {
    const events = [1, 2, 3, 4, 5].map((n) => created(`a${n}`, `task ${n}`, 100 * n));
    const state = project(events, NOW);
    expect(landingActions(state)).toHaveLength(LANDING_SIZE);
    expect(landingActions(state).map((a) => a.id)).toEqual(["a1", "a2", "a3"]);
  });

  it("does not include delayed or done actions in the landing", () => {
    const events = [
      created("a1", "1", 100),
      created("a2", "2", 200),
      created("a3", "3", 300),
      delayed("a2", NOW + 100 * HOUR),
      done("a3"),
      created("a4", "4", 400),
    ];
    const state = project(events, NOW);
    expect(landingActions(state).map((a) => a.id)).toEqual(["a1", "a4"]);
  });
});