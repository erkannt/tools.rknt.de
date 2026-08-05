import type {
  ActionDelayed,
  ActionDeleted,
  ActionDone,
  ActionEvent,
} from "./events";
import { delayDuration } from "./delay";
import type { State } from "./projection";

export type NewId = () => string;

const cryptoNewId: NewId = () => crypto.randomUUID();

export function createAction(
  text: string,
  now: number,
  newId: NewId = cryptoNewId,
): ActionEvent | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  return {
    type: "actionCreated",
    id: newId(),
    text: trimmed,
    createdAt: now,
  };
}

export function markDone(state: State, id: string, now: number): ActionDone | null {
  if (!isAvailable(state, id)) return null;
  return { type: "actionDone", id, doneAt: now };
}

export function delayAction(
  state: State,
  id: string,
  now: number,
): ActionDelayed | null {
  const action = state.actions.find((candidate) => candidate.id === id);
  if (!action || action.status !== "available") return null;
  const duration = delayDuration(action.numberOfDelays);
  return {
    type: "actionDelayed",
    id,
    delayedAt: now,
    delayUntil: now + duration,
  };
}

export function deleteAction(
  state: State,
  id: string,
  now: number,
): ActionDeleted | null {
  if (!isAvailable(state, id)) return null;
  return { type: "actionDeleted", id, deletedAt: now };
}

function isAvailable(state: State, id: string): boolean {
  const action = state.actions.find((candidate) => candidate.id === id);
  return action?.status === "available";
}
