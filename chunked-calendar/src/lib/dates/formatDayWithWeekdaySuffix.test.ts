import { describe, it, expect } from "vitest";
import { formatDayWithWeekdaySuffix } from "./formatDayWithWeekdaySuffix";

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