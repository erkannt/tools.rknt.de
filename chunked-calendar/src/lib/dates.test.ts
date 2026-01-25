import { describe, it, expect } from "vitest";
import {
  formatDay,
  formatDayWithWeekdaySuffix,
  generateWeekdays,
  getDatesForYear,
  isFirstOfMonth,
  splitIntoQuarters,
  splitIntoQuartersWithChunks,
} from "./dates";

describe("isFirstOfMonth", () => {
  type TestCase = {
    desc: string;
    date: string;
    expected: boolean;
  };

  const testCases: readonly TestCase[] = [
    {
      desc: "returns true for the first day of the month",
      date: "2024-01-01",
      expected: true,
    },
    {
      desc: "returns false for a day in the middle of the month",
      date: "2024-01-15",
      expected: false,
    },
    {
      desc: "returns true for the first day of a different month",
      date: "2024-12-01",
      expected: true,
    },
    {
      desc: "returns false for leap year non-first day",
      date: "2024-02-29",
      expected: false,
    },
  ];

  it.each(testCases)("$desc", ({ date, expected }) => {
    expect(isFirstOfMonth(date)).toBe(expected);
  });
});

describe("formatDay", () => {
  type TestCase = {
    desc: string;
    date: string;
    expected: string;
  };

  const testCases: readonly TestCase[] = [
    {
      desc: "returns month name for first day of month",
      date: "2024-01-01",
      expected: "Jan",
    },
    {
      desc: "returns month name for December 1st",
      date: "2024-12-01",
      expected: "Dec",
    },
    {
      desc: "returns zero-padded day for middle of month",
      date: "2024-01-05",
      expected: "05",
    },
    {
      desc: "returns zero-padded day for single digit day",
      date: "2024-01-09",
      expected: "09",
    },
    {
      desc: "returns zero-padded day for double digit day",
      date: "2024-01-15",
      expected: "15",
    },
    {
      desc: "returns zero-padded day for last day of month",
      date: "2024-01-31",
      expected: "31",
    },
    {
      desc: "handles leap year first day",
      date: "2024-02-01",
      expected: "Feb",
    },
    {
      desc: "handles leap year February 29th",
      date: "2024-02-29",
      expected: "29",
    },
  ];

  it.each(testCases)("$desc", ({ date, expected }) => {
    expect(formatDay(date)).toBe(expected);
  });
});

describe("formatDayWithWeekdaySuffix", () => {
  type TestCase = {
    desc: string;
    date: string;
    expected: string;
  };

  const testCases: readonly TestCase[] = [
    {
      desc: "returns month name for first day of month",
      date: "2024-01-01",
      expected: "Jan",
    },
    {
      desc: "returns month name for December 1st",
      date: "2024-12-01",
      expected: "Dec",
    },
    {
      desc: "returns day with weekday for Monday",
      date: "2024-01-08", // Monday
      expected: "08 M",
    },
    {
      desc: "returns day with weekday for Sunday",
      date: "2024-01-07", // Sunday
      expected: "07 S",
    },
    {
      desc: "handles leap year February 29th",
      date: "2024-02-29", // Thursday
      expected: "29 T",
    },
  ];

  it.each(testCases)("$desc", ({ date, expected }) => {
    const result = formatDayWithWeekdaySuffix(date);
    expect(result).toBe(expected);
  });
});

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
