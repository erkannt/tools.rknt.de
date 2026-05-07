import { describe, it, expect } from "vitest";
import { encodeRituals, decodeRituals } from "./shareCodec";
import type { Ritual } from "./types";

describe("shareCodec round-trip", () => {
  it("encodes and decodes a single ritual", async () => {
    const rituals: Ritual[] = [
      { id: "abc-123", name: "Morning", markdown: "stretch 30\nbreathe 60" },
    ];
    const encoded = await encodeRituals(rituals);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = await decodeRituals(encoded);
    expect(decoded).toEqual(rituals);
  });

  it("encodes and decodes multiple rituals", async () => {
    const rituals: Ritual[] = [
      { id: "a", name: "One", markdown: "step 1" },
      { id: "b", name: "Two", markdown: "---\ncode\n---" },
    ];
    const encoded = await encodeRituals(rituals);
    const decoded = await decodeRituals(encoded);
    expect(decoded).toEqual(rituals);
  });

  it("produces URL-safe base64", async () => {
    const rituals: Ritual[] = [
      { id: "x", name: "Test", markdown: "step 1" },
    ];
    const encoded = await encodeRituals(rituals);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("handles empty array", async () => {
    const rituals: Ritual[] = [];
    const encoded = await encodeRituals(rituals);
    const decoded = await decodeRituals(encoded);
    expect(decoded).toEqual([]);
  });

  it("handles unicode content", async () => {
    const rituals: Ritual[] = [
      { id: "u", name: "日本語", markdown: "ステップ 1\n🧘 30" },
    ];
    const encoded = await encodeRituals(rituals);
    const decoded = await decodeRituals(encoded);
    expect(decoded).toEqual(rituals);
  });
});
