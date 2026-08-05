import { describe, expect, it } from "vitest";
import { DELAY_SLOT_MS, HOUR_MS, delayDuration, fibonacci } from "./delay";

describe("fibonacci", () => {
  it("returns the classic sequence", () => {
    expect(fibonacci(0)).toBe(0);
    expect(fibonacci(1)).toBe(1);
    expect(fibonacci(2)).toBe(1);
    expect(fibonacci(3)).toBe(2);
    expect(fibonacci(4)).toBe(3);
    expect(fibonacci(5)).toBe(5);
    expect(fibonacci(6)).toBe(8);
  });
});

describe("delayDuration", () => {
  it("escalates by fibonacci(numberOfPriorDelays + 1) x 6h", () => {
    expect(delayDuration(0)).toBe(fibonacci(1) * DELAY_SLOT_MS); // 6h
    expect(delayDuration(1)).toBe(fibonacci(2) * DELAY_SLOT_MS); // 6h
    expect(delayDuration(2)).toBe(fibonacci(3) * DELAY_SLOT_MS); // 12h
    expect(delayDuration(3)).toBe(fibonacci(4) * DELAY_SLOT_MS); // 18h
    expect(delayDuration(4)).toBe(fibonacci(5) * DELAY_SLOT_MS); // 30h
  });

  it("is proportional to 6h slots", () => {
    expect(delayDuration(3)).toBe(3 * 6 * HOUR_MS);
  });

  it("rejects a negative delay count", () => {
    expect(() => delayDuration(-1)).toThrow();
  });
});