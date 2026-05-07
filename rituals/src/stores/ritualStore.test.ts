import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRitualStore } from "./ritualStore";
import type { Ritual } from "../lib/types";

describe("ritualStore", () => {
  let store: ReturnType<typeof createRitualStore>;

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "test-uuid-123") });
    store = createRitualStore();
  });

  it("starts empty", () => {
    expect(store.current).toEqual([]);
  });

  it("adds a ritual", () => {
    store.add("Morning", "stretch 30");
    expect(store.current).toHaveLength(1);
    expect(store.current[0]).toEqual({
      id: "test-uuid-123",
      name: "Morning",
      markdown: "stretch 30",
    });
  });

  it("updates a ritual by id", () => {
    store.add("Old", "step 1");
    const id = store.current[0].id;
    store.update(id, "New", "step 1\nstep 2");
    expect(store.current[0]).toEqual({
      id,
      name: "New",
      markdown: "step 1\nstep 2",
    });
  });

  it("removes a ritual by id", () => {
    store.add("One", "a");
    store.add("Two", "b");
    const id = store.current[0].id;
    store.remove(id);
    expect(store.current).toHaveLength(1);
    expect(store.current[0].name).toBe("Two");
  });

  it("finds ritual by id", () => {
    store.add("One", "a");
    const id = store.current[0].id;
    expect(store.findById(id)?.name).toBe("One");
    expect(store.findById("nonexistent")).toBeNull();
  });

  it("returns existing name or null", () => {
    store.add("One", "a");
    const id = store.current[0].id;
    expect(store.getExistingName(id)).toBe("One");
    expect(store.getExistingName("nonexistent")).toBeNull();
  });

  it("imports a new ritual", () => {
    const ritual: Ritual = { id: "ext-1", name: "External", markdown: "m" };
    store.importRitual(ritual);
    expect(store.current).toHaveLength(1);
    expect(store.current[0]).toEqual(ritual);
  });

  it("overwrites existing ritual on import", () => {
    store.add("Old", "old");
    const id = store.current[0].id;
    store.importRitual({ id, name: "New", markdown: "new" });
    expect(store.current).toHaveLength(1);
    expect(store.current[0].name).toBe("New");
    expect(store.current[0].markdown).toBe("new");
  });

  it("persists to localStorage", () => {
    store.add("Persist", "test");
    const raw = localStorage.getItem("rituals");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].name).toBe("Persist");
  });
});
