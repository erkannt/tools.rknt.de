import type { RitualLine } from "./types";

export function parseDuration(content: string): number | null {
  const match = content.trim().match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : null;
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
      const duration = parseDuration(line);
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
