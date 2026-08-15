import { describe, it, expect } from "vitest";
import { parseTimer, renderRitualLines } from "./ritualParser";

describe("parseTimer", () => {
  it("returns null for content without trailing number", () => {
    expect(parseTimer("breathe")).toBeNull();
    expect(parseTimer("step one")).toBeNull();
  });

  it("returns null when number is not preceded by whitespace", () => {
    expect(parseTimer("foo60")).toBeNull();
    expect(parseTimer("foo 5+5")).toBeNull();
    expect(parseTimer("foo 60bar")).toBeNull();
  });

  it("parses trailing number as single-repeat timer", () => {
    expect(parseTimer("breathe 60")).toEqual({ repeats: 1, duration: 60 });
    expect(parseTimer("hold 10")).toEqual({ repeats: 1, duration: 10 });
  });

  it("parses number with trailing whitespace", () => {
    expect(parseTimer("breathe 60 ")).toEqual({ repeats: 1, duration: 60 });
  });

  it("parses multi-digit numbers", () => {
    expect(parseTimer("wait 120")).toEqual({ repeats: 1, duration: 120 });
  });

  it("returns the last space-separated number only", () => {
    expect(parseTimer("step 2 3")).toEqual({ repeats: 1, duration: 3 });
    expect(parseTimer("hold for 10 then 20")).toEqual({ repeats: 1, duration: 20 });
  });

  it("parses repeat timer syntax", () => {
    expect(parseTimer("5x30")).toEqual({ repeats: 5, duration: 30 });
    expect(parseTimer("breathe 5x30")).toEqual({ repeats: 5, duration: 30 });
  });

  it("parses repeat timer with trailing whitespace", () => {
    expect(parseTimer("breathe 5x30 ")).toEqual({ repeats: 5, duration: 30 });
  });

  it("parses single repeat as repeat timer", () => {
    expect(parseTimer("1x30")).toEqual({ repeats: 1, duration: 30 });
  });

  it("returns null for malformed repeat syntax", () => {
    expect(parseTimer("x30")).toBeNull();
    expect(parseTimer("5x")).toBeNull();
    expect(parseTimer("5x30s")).toBeNull();
  });

  it("treats spaced-out repeat syntax as plain timer", () => {
    expect(parseTimer("5 x 30")).toEqual({ repeats: 1, duration: 30 });
  });

  it("returns null for zero repeats", () => {
    expect(parseTimer("0x30")).toBeNull();
  });
});

describe("renderRitualLines", () => {
  it("returns empty array for empty content", () => {
    expect(renderRitualLines("")).toEqual([]);
  });

  it("returns empty array for whitespace-only content", () => {
    expect(renderRitualLines("   \n   \n  ")).toEqual([]);
  });

  it("converts each line to a checkbox", () => {
    const lines = renderRitualLines("step 1\nstep 2");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ type: "checkbox", content: "step 1", duration: { repeats: 1, duration: 1 }, index: 0 });
    expect(lines[1]).toEqual({ type: "checkbox", content: "step 2", duration: { repeats: 1, duration: 2 }, index: 1 });
  });

  it("parses durations on checkbox lines", () => {
    const lines = renderRitualLines("breathe 60\nhold 10");
    expect(lines[0].duration).toEqual({ repeats: 1, duration: 60 });
    expect(lines[1].duration).toEqual({ repeats: 1, duration: 10 });
  });

  it("parses repeat timers on checkbox lines", () => {
    const lines = renderRitualLines("breathe 5x30");
    expect(lines[0].duration).toEqual({ repeats: 5, duration: 30 });
  });

  it("switches to pre block after --- delimiter", () => {
    const lines = renderRitualLines("step 1\n---\ncode line 1\ncode line 2");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ type: "checkbox", content: "step 1", duration: { repeats: 1, duration: 1 }, index: 0 });
    expect(lines[1]).toEqual({ type: "pre", content: "code line 1\ncode line 2", duration: null, index: -1 });
  });

  it("toggles pre block off with second ---", () => {
    const lines = renderRitualLines("---\npre content\n---\nstep 1");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ type: "pre", content: "pre content", duration: null, index: -1 });
    expect(lines[1]).toEqual({ type: "checkbox", content: "step 1", duration: { repeats: 1, duration: 1 }, index: 0 });
  });

  it("ignores empty lines", () => {
    const lines = renderRitualLines("step 1\n\n\nstep 2");
    expect(lines).toHaveLength(2);
    expect(lines[0].index).toBe(0);
    expect(lines[1].index).toBe(1);
  });

  it("handles multiple pre blocks", () => {
    const lines = renderRitualLines("a\n---\npre1\n---\nb\n---\npre2");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toEqual({ type: "checkbox", content: "a", duration: null, index: 0 });
    expect(lines[1]).toEqual({ type: "pre", content: "pre1", duration: null, index: -1 });
    expect(lines[2]).toEqual({ type: "checkbox", content: "b", duration: null, index: 1 });
    expect(lines[3]).toEqual({ type: "pre", content: "pre2", duration: null, index: -1 });
  });

  it("handles unclosed pre block", () => {
    const lines = renderRitualLines("step 1\n---\npre content");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toEqual({ type: "pre", content: "pre content", duration: null, index: -1 });
  });
});
