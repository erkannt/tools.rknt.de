import { describe, expect, it } from "vitest";
import { normal, uniform } from "./random";

const take = (next: () => number, n: number) => Array.from({ length: n }, next);

describe("uniform", () => {
  it("repeats for the same seed and differs between seeds", () => {
    expect(take(uniform(42), 5)).toEqual(take(uniform(42), 5));
    expect(take(uniform(42), 5)).not.toEqual(take(uniform(43), 5));
  });

  it("stays in [0, 1)", () => {
    for (const v of take(uniform(1), 10_000)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("normal", () => {
  it("has mean 0 and standard deviation 1", () => {
    const xs = take(normal(7), 100_000);
    const mean = xs.reduce((a, b) => a + b) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length);
    expect(mean).toBeCloseTo(0, 1);
    expect(sd).toBeCloseTo(1, 1);
  });
});
