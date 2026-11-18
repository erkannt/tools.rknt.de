import { describe, expect, it } from "vitest";
import { buildLayers, type Params } from "./layers";
import fixtures from "./fixtures/tmm.json";

// The fixture generator (scripts/fixtures.py) keeps its own copy of the layer
// values. Make sure it hasn't drifted from layers.ts.
describe("tmm fixtures", () => {
  const stackCases = fixtures.cases.filter((c) => "params" in c);

  it("include stack cases", () => {
    expect(stackCases.length).toBeGreaterThan(0);
  });

  it.each(stackCases.map((c) => [c.name, c] as const))(
    "%s matches buildLayers",
    (_, c) => {
      const expected = buildLayers((c as { params: Params }).params).map((l) => ({
        re: l.index.re,
        im: l.index.im,
        thickness: Number.isFinite(l.thickness) ? l.thickness : null,
      }));
      expect(c.layers).toEqual(expected);
    },
  );
});
