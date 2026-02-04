import { describe, it, expect } from "vitest";
import { splitIntoQuartersWithChunks } from "./splitIntoQuartersWithChunks";

describe("splitIntoQuartersWithChunks", () => {
  // Create test data: 364 days (52 weeks * 7 days)
  const dates = Array.from({ length: 364 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i);
    return date.toISOString().split("T")[0];
  });

  const quarters = splitIntoQuartersWithChunks(dates);

  it("splits a full year into 4 quarters with chunks", () => {
    expect(quarters).toHaveLength(4);
  });

  it("each quarter has 4 chunks", () => {
    quarters.forEach((quarter) => {
      expect(quarter).toHaveLength(4);
    });
  });

  it("first three chunks of each quarter have 4 weeks (28 days)", () => {
    quarters.forEach((quarter) => {
      expect(quarter[0]).toHaveLength(28); // 4 weeks * 7 days
      expect(quarter[1]).toHaveLength(28); // 4 weeks * 7 days
      expect(quarter[2]).toHaveLength(28); // 4 weeks * 7 days
    });
  });

  it("last chunk has 1 week (7 days) for normal year", () => {
    quarters.forEach((quarter, index) => {
      if (index < 3) {
        expect(quarter[3]).toHaveLength(7); // 1 week * 7 days
      }
    });
  });

  it("last chunk has 2 weeks (14 days) for 53-week year final quarter", () => {
    const dates = Array.from({ length: 371 }, (_, i) => {
      const date = new Date(2024, 0, 1 + i);
      return date.toISOString().split("T")[0];
    });

    const quarters = splitIntoQuartersWithChunks(dates);
    expect(quarters[3][3]).toHaveLength(14); // 2 weeks * 7 days for 53-week year
  });
});