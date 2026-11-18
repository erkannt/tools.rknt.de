import { describe, expect, it } from "vitest";
import { buildLayers, defaultParams } from "./layers";
import { reflectance } from "./reflectance";
import { steps } from "./plot";

describe("reflectance", () => {
  const angles = steps(40, 80, 0.5);

  it("returns one value in [0, 1] per angle", () => {
    const r = reflectance(buildLayers(defaultParams), 633, angles);
    expect(r).toHaveLength(angles.length);
    for (const v of r) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
