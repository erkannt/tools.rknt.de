import { describe, it, expect } from "vitest";
import { generateWeekdays } from "./generateWeekdays";

describe("generateWeekdays", () => {
  const weekdays = generateWeekdays();
  it("returns an array of 7 weekday names", () => {
    expect(weekdays).toHaveLength(7);
  });

  it("returns unique weekday names", () => {
    const uniqueWeekdays = [...new Set(weekdays)];
    expect(weekdays).toEqual(uniqueWeekdays);
  });

  it("consistently returns the same result", () => {
    const weekdays2 = generateWeekdays();
    expect(weekdays).toEqual(weekdays2);
  });
});