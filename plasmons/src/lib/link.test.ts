import { describe, expect, it } from "vitest";
import { decodePoints, encodePoints, pointAngles, type Points } from "./link";

describe("point links", () => {
  const points: Points = {
    start: 30,
    step: 0.2,
    reflectance: Array.from({ length: 211 }, (_, i) => (Math.sin(i) + 1) / 2),
  };

  it("round-trip to within the 16-bit precision", () => {
    const decoded = decodePoints(encodePoints(points))!;
    expect(decoded.start).toBe(points.start);
    expect(decoded.step).toBe(points.step);
    expect(decoded.reflectance).toHaveLength(points.reflectance.length);
    decoded.reflectance.forEach((r, i) => expect(Math.abs(r - points.reflectance[i])).toBeLessThanOrEqual(0.5 / 0xffff));
  });

  it("keep 0 and 1 exact", () => {
    expect(decodePoints(encodePoints({ start: 0, step: 1, reflectance: [0, 1] }))!.reflectance).toEqual([0, 1]);
  });

  it("are URL safe and short", () => {
    const encoded = encodePoints(points);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded.length).toBeLessThan(600);
  });

  it.each(["", "!!!", "AAAA", encodePoints(points).slice(0, -4)])("reject invalid input %j", (s) => {
    expect(decodePoints(s)).toBeNull();
  });

  it("give evenly spaced angles", () => {
    expect(pointAngles({ start: 30, step: 0.5, reflectance: [0, 0, 0] })).toEqual([30, 30.5, 31]);
  });
});
