import { describe, it, expect } from "vitest";
import { splitIntoQuarters } from "./splitIntoQuarters";

describe("splitIntoQuarters", () => {
  // Create test data: 364 days (52 weeks * 7 days)
  const dates = Array.from({ length: 364 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i);
    return date.toISOString().split("T")[0];
  });

  const quarters = splitIntoQuarters(dates);
  it("splits a full year into 4 quarters", () => {
    expect(quarters).toHaveLength(4);
  });

  it("each quarter has 13 weeks", () => {
    quarters.forEach((quarter) => {
      expect(quarter).toHaveLength(13);
    });
  });

  it("each week has 7 days", () => {
    quarters.forEach((quarter) => {
      quarter.forEach((week) => {
        expect(week).toHaveLength(7);
      });
    });
  });

  it("handles 53-week year by adding extra week to fourth quarter", () => {
    const longYearDates = Array.from({ length: 371 }, (_, i) => {
      const date = new Date(2024, 0, 1 + i);
      return date.toISOString().split("T")[0];
    });

    const quarters = splitIntoQuarters(longYearDates);
    expect(quarters).toHaveLength(4);
    expect(quarters[0]).toHaveLength(13);
    expect(quarters[1]).toHaveLength(13);
    expect(quarters[2]).toHaveLength(13);
    expect(quarters[3]).toHaveLength(14); // Extra week
  });

  it("handles partial data gracefully", () => {
    const dates = ["2024-01-01", "2024-01-02"];
    const quarters = splitIntoQuarters(dates);
    expect(quarters).toHaveLength(1);
    expect(quarters[0]).toHaveLength(1);
    expect(quarters[0][0]).toHaveLength(2);
  });
});