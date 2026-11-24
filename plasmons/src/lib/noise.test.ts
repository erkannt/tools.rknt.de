import { describe, expect, it } from "vitest";
import { addNoise } from "./noise";

describe("addNoise", () => {
  const values = Array.from({ length: 200 }, (_, i) => i / 199);

  it("leaves values unchanged without noise", () => {
    expect(addNoise(values, 0, 1)).toEqual(values);
  });

  it("gives the same pattern for the same seed", () => {
    expect(addNoise(values, 0.05, 1)).toEqual(addNoise(values, 0.05, 1));
    expect(addNoise(values, 0.05, 1)).not.toEqual(addNoise(values, 0.05, 2));
  });

  it("clamps to [0, 1]", () => {
    for (const v of addNoise(values, 0.5, 3)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
