import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("environment loads", () => {
    expect(document).toBeDefined();
  });
});