import { describe, expect, it } from "vitest";
import { angleRange, defaultParams, paramRanges, wavelength } from "./constants";
import { buildLayers, type Params } from "./layers";
import fixtures from "./fixtures/tmm.json";

// The fixture generator (scripts/fixtures.py) keeps its own copy of the values
// in constants.ts. Make sure they haven't drifted apart.
describe("tmm fixtures", () => {
  const stackCases = fixtures.cases.filter((c) => "params" in c) as ((typeof fixtures.cases)[number] & {
    params: Params;
  })[];

  it("include stack cases", () => {
    expect(stackCases.length).toBeGreaterThan(0);
  });

  it.each(fixtures.cases.map((c) => [c.name, c] as const))("%s uses the app's wavelength and angles", (_, c) => {
    expect(c.wavelength).toBe(wavelength);
    expect(c.angles[0]).toBe(angleRange.min);
    expect(c.angles[c.angles.length - 1]).toBe(angleRange.max);
    expect(c.angles).toHaveLength(Math.round((angleRange.max - angleRange.min) / angleRange.step) + 1);
  });

  it.each(stackCases.map((c) => [c.name, c] as const))("%s matches buildLayers", (_, c) => {
    const expected = buildLayers(c.params).map((l) => ({
      re: l.index.re,
      im: l.index.im,
      thickness: Number.isFinite(l.thickness) ? l.thickness : null,
    }));
    expect(c.layers).toEqual(expected);
  });

  it("use the default params", () => {
    expect(stackCases.find((c) => c.name === "stack, defaults")?.params).toEqual(defaultParams);
  });

  it.each(Object.entries(paramRanges))("cover the %s slider range", (param, range) => {
    for (const bound of ["min", "max"] as const) {
      const c = stackCases.find((c) => c.name === `stack, ${param} ${bound}`);
      expect(c?.params).toEqual({ ...defaultParams, [param]: range[bound] });
    }
  });
});
