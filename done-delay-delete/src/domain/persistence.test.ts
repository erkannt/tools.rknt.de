import { describe, expect, it } from "vitest";
import { STORAGE_KEY, loadEvents, saveEvents, type Storage } from "./persistence";
import type { ActionEvent } from "./events";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
  };
}

const event: ActionEvent = {
  type: "actionCreated",
  id: "a",
  text: "buy milk",
  createdAt: 1000,
};

describe("persistence", () => {
  it("round-trips events through storage", () => {
    const storage = memoryStorage();
    saveEvents(storage, [event]);
    expect(loadEvents(storage)).toEqual([event]);
  });

  it("returns empty array when nothing stored", () => {
    expect(loadEvents(memoryStorage())).toEqual([]);
  });

  it("returns empty array for corrupt JSON", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "{not json" });
    expect(loadEvents(storage)).toEqual([]);
  });

  it("returns empty array for non-array JSON", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ a: 1 }) });
    expect(loadEvents(storage)).toEqual([]);
  });

  it("persists under the agreed key", () => {
    const storage = memoryStorage();
    saveEvents(storage, [event]);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toEqual([event]);
  });
});