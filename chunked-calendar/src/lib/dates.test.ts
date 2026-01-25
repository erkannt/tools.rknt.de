import { describe, it, expect } from "vitest";
import { isFirstOfMonth } from "./dates";

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
