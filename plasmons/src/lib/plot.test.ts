import { describe, expect, it } from "vitest";
import { crossesPath, linePath, linearScale, steps } from "./plot";

describe("linearScale", () => {
  it("maps domain ends onto range ends", () => {
    const s = linearScale([40, 80], [60, 580]);
    expect(s(40)).toBe(60);
    expect(s(80)).toBe(580);
    expect(s(60)).toBe(320);
  });

  it("supports inverted ranges for svg y axes", () => {
    const s = linearScale([0, 1], [340, 20]);
    expect(s(0)).toBe(340);
    expect(s(1)).toBe(20);
  });
});

describe("steps", () => {
  it("includes both ends", () => {
    expect(steps(0, 1, 0.25)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });
});

describe("linePath", () => {
  it("moves to the first point and draws lines to the rest", () => {
    expect(linePath([0, 1, 2], [3, 4, 5])).toBe("M 0.00 3.00 L 1.00 4.00 L 2.00 5.00");
  });

  it("is empty for no points", () => {
    expect(linePath([], [])).toBe("");
  });
});

describe("crossesPath", () => {
  it("draws both diagonals of each cross", () => {
    expect(crossesPath([10], [20], 2)).toBe("M 8.00 18.00 L 12.00 22.00 M 8.00 22.00 L 12.00 18.00");
  });
});
