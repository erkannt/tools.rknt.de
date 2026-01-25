/** Return day of month, or abbreviated month name if it's the first day */
export function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  if (day === 1) {
    // Use the user's locale; fallback to default if unavailable
    return d.toLocaleString(undefined, { month: "short" });
  }
  // Zero‑pad day numbers (e.g., "01", "02", …)
  return day.toString().padStart(2, "0");
}