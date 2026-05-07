import { describe, it, expect } from "vitest";
import { parseDuration, renderRitualLines } from "./ritualParser";

describe("parseDuration", () => {
  it("returns null for content without trailing number", () => {
    expect(parseDuration("breathe")).toBeNull();
    expect(parseDuration("step one")).toBeNull();
  });

  it("returns null when number is not preceded by whitespace", () => {
    expect(parseDuration("foo60")).toBeNull();
    expect(parseDuration("foo 5+5")).toBeNull();
    expect(parseDuration("foo 60bar")).toBeNull();
  });

  it("parses trailing number as seconds", () => {
    expect(parseDuration("breathe 60")).toBe(60);
    expect(parseDuration("hold 10")).toBe(10);
  });

  it("parses number with trailing whitespace", () => {
    expect(parseDuration("breathe 60 ")).toBe(60);
  });

  it("parses multi-digit numbers", () => {
    expect(parseDuration("wait 120")).toBe(120);
  });

  it("returns the last space-separated number only", () => {
    expect(parseDuration("step 2 3")).toBe(3);
    expect(parseDuration("hold for 10 then 20")).toBe(20);
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
    expect(lines[0]).toEqual({ type: "checkbox", content: "step 1", duration: 1, index: 0 });
    expect(lines[1]).toEqual({ type: "checkbox", content: "step 2", duration: 2, index: 1 });
  });

  it("parses durations on checkbox lines", () => {
    const lines = renderRitualLines("breathe 60\nhold 10");
    expect(lines[0].duration).toBe(60);
    expect(lines[1].duration).toBe(10);
  });

  it("switches to pre block after --- delimiter", () => {
    const lines = renderRitualLines("step 1\n---\ncode line 1\ncode line 2");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ type: "checkbox", content: "step 1", duration: 1, index: 0 });
    expect(lines[1]).toEqual({ type: "pre", content: "code line 1\ncode line 2", duration: null, index: -1 });
  });

  it("toggles pre block off with second ---", () => {
    const lines = renderRitualLines("---\npre content\n---\nstep 1");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ type: "pre", content: "pre content", duration: null, index: -1 });
    expect(lines[1]).toEqual({ type: "checkbox", content: "step 1", duration: 1, index: 0 });
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
