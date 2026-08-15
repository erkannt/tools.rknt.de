import type { RitualLine, TimerSpec } from "./types";

export function parseTimer(content: string): TimerSpec | null {
  const trimmed = content.trim();
  const repeated = trimmed.match(/(?:^|\s)(\d+)x(\d+)\s*$/);
  if (repeated) {
    const repeats = parseInt(repeated[1], 10);
    if (repeats < 1) return null;
    return { repeats, duration: parseInt(repeated[2], 10) };
  }
  const single = trimmed.match(/(?:^|\s)(\d+)\s*$/);
  return single ? { repeats: 1, duration: parseInt(single[1], 10) } : null;
}

export function renderRitualLines(content: string): RitualLine[] {
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  const result: RitualLine[] = [];
  let inPreBlock = false;
  let preContent = "";
  let checkboxCount = 0;

  for (const line of lines) {
    if (line.trim() === "---") {
      if (inPreBlock && preContent.trim()) {
        result.push({ type: "pre", content: preContent.trim(), duration: null, index: -1 });
        preContent = "";
      }
      inPreBlock = !inPreBlock;
    } else if (inPreBlock) {
      preContent += line + "\n";
    } else {
      const duration = parseTimer(line);
      result.push({
        type: "checkbox",
        content: line,
        duration,
        index: checkboxCount++,
      });
    }
  }

  // Add any remaining pre content
  if (inPreBlock && preContent.trim()) {
    result.push({ type: "pre", content: preContent.trim(), duration: null, index: -1 });
  }

  return result;
}
