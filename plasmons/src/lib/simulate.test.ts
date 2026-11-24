import { describe, expect, it } from "vitest";
import { defaultParams } from "./constants";
import { pointAngles, simulate } from "./simulate";

describe("simulate", () => {
  const sim = { params: defaultParams, noise: 0.01, seed: 1 };

  it("gives one point per angle", () => {
    expect(simulate(sim)).toHaveLength(pointAngles.length);
  });

  it("is reproducible", () => {
    expect(simulate({ ...sim, params: { ...defaultParams } })).toEqual(simulate(sim));
  });
});
