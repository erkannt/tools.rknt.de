import { describe, it, expect } from "vitest";
import { getDatesForYear } from "./getDatesForYear";

describe("getDatesForYear", () => {
  it("generates correct number of days for normal year", () => {
    const dates = getDatesForYear(2024);
    expect(dates).toHaveLength(364); // 52 weeks * 7 days
  });

  it("generates correct number of days for long year", () => {
    const dates = getDatesForYear(2026); // 2026 has 53 weeks
    expect(dates).toHaveLength(371); // 53 weeks * 7 days
  });

  it("generates dates in YYYY-MM-DD format", () => {
    const dates = getDatesForYear(2024);
    dates.forEach((date) => {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("generates consecutive dates", () => {
    const dates = getDatesForYear(2024);
    const maxIndex = dates.length - 2;
    const randomIndex = Math.floor(Math.random() * (maxIndex + 1));
    const firstDate = new Date(dates[randomIndex]);
    const secondDate = new Date(dates[randomIndex + 1]);
    const diffMs = secondDate.getTime() - firstDate.getTime();
    expect(diffMs).toBe(24 * 60 * 60 * 1000); // 1 day
  });

  it("starts on a Monday", () => {
    const dates = getDatesForYear(2024);
    const firstDate = new Date(dates[0]);
    const dayOfWeek = firstDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    expect(dayOfWeek).toBe(1); // Monday
  });
});