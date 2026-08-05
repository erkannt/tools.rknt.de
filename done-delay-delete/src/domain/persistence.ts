import type { ActionEvent } from "./events";

export const STORAGE_KEY = "ddd.events.v1";

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadEvents(storage: Storage): ActionEvent[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ActionEvent[];
  } catch {
    return [];
  }
}

export function saveEvents(storage: Storage, events: ActionEvent[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(events));
}