import type { ActionEvent } from "./events";

export const LANDING_SIZE = 3;

export type ActionStatus = "available" | "delayed" | "done" | "deleted";

export type Action = {
  id: string;
  text: string;
  createdAt: number;
  status: ActionStatus;
  showAt: number;
  numberOfDelays: number;
};

export type State = {
  actions: Action[];
};

export function emptyState(): State {
  return { actions: [] };
}

export function project(events: ActionEvent[], now: number): State {
  const byId = new Map<string, Action>();

  for (const event of events) {
    const existing = byId.get(event.id);
    switch (event.type) {
      case "actionCreated":
        byId.set(event.id, {
          id: event.id,
          text: event.text,
          createdAt: event.createdAt,
          status: "available",
          showAt: event.createdAt,
          numberOfDelays: 0,
        });
        break;
      case "actionDelayed":
        if (existing) {
          existing.numberOfDelays += 1;
          existing.showAt = event.delayUntil;
          existing.status = event.delayUntil > now ? "delayed" : "available";
        }
        break;
      case "actionDone":
        if (existing) existing.status = "done";
        break;
      case "actionDeleted":
        if (existing) existing.status = "deleted";
        break;
    }
  }

  return { actions: [...byId.values()] };
}

export function availableActions(state: State): Action[] {
  return state.actions
    .filter((action) => action.status === "available")
    .sort(compareByShowAt);
}

export function delayedActions(state: State): Action[] {
  return state.actions
    .filter((action) => action.status === "delayed")
    .sort(compareByShowAt);
}

export function landingActions(state: State): Action[] {
  return availableActions(state).slice(0, LANDING_SIZE);
}

function compareByShowAt(a: Action, b: Action): number {
  return a.showAt - b.showAt || a.createdAt - b.createdAt || a.id.localeCompare(b.id);
}
