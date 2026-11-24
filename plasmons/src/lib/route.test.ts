import { describe, expect, it } from "vitest";
import { defaultParams } from "./constants";
import { encodeSimulation } from "./link";
import { parseRoute } from "./route";

describe("parseRoute", () => {
  it.each(["", "#", "#/"])("shows the explore view for %j", (hash) => {
    expect(parseRoute(hash)).toEqual({ view: "explore" });
  });

  it("shows the create view for #/create", () => {
    expect(parseRoute("#/create")).toEqual({ view: "create" });
  });

  it("shows the fit view with the simulation from the link", () => {
    const simulation = { params: defaultParams, noise: 0.02, seed: 123 };
    expect(parseRoute(`#/fit/${encodeSimulation(simulation)}`)).toEqual({ view: "fit", simulation });
  });

  it.each(["#/fit", "#/fit/", "#/fit/garbage"])("falls back to the explore view for the broken fit link %j", (hash) => {
    expect(parseRoute(hash)).toEqual({ view: "explore" });
  });

  it("falls back to the explore view for unknown routes", () => {
    expect(parseRoute("#/nope/abc")).toEqual({ view: "explore" });
  });
});
