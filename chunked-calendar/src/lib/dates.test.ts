import { describe, it, expect } from "vitest";
import { formatDay, isFirstOfMonth } from "./dates";

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
