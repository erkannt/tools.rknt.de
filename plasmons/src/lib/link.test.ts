import { describe, expect, it } from "vitest";
import { decodeSimulation, encodeSimulation } from "./link";
import type { Simulation } from "./simulate";

describe("simulation links", () => {
  const sim: Simulation = {
    params: { cytosolIndex: 1.371, mediaThickness: 73, goldThickness: 46.5, chromiumThickness: 3.2 },
    noise: 0.013,
    seed: 0xdeadbeef,
  };

  it("round-trip exactly", () => {
    expect(decodeSimulation(encodeSimulation(sim))).toEqual(sim);
  });

  it("are URL safe and short", () => {
    const encoded = encodeSimulation(sim);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded.length).toBeLessThan(80);
  });

  it.each([
    ["empty", ""],
    ["not base64", "!!!"],
    ["too short", encodeSimulation(sim).slice(0, -4)],
    ["negative noise", encodeSimulation({ ...sim, noise: -1 })],
    ["non-finite param", encodeSimulation({ ...sim, params: { ...sim.params, goldThickness: NaN } })],
  ])("reject %s input", (_, s) => {
    expect(decodeSimulation(s)).toBeNull();
  });
});
