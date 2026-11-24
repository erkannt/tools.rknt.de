import { describe, expect, it } from "vitest";
import { parseRoute } from "./route";

describe("parseRoute", () => {
  it.each(["", "#", "#/"])("shows the explore view for %j", (hash) => {
    expect(parseRoute(hash)).toEqual({ view: "explore" });
  });

  it("shows the create view for #/create", () => {
    expect(parseRoute("#/create")).toEqual({ view: "create" });
  });

  it("falls back to the explore view for unknown routes", () => {
    expect(parseRoute("#/nope/abc")).toEqual({ view: "explore" });
  });
});
