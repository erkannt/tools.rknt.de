/**
 * Formats a date string for calendar display with weekday suffix with first day of month showing month name.
 *
 * If the date is the first day of the month, returns the short month name.
 * Otherwise returns the zero-padded day number followed by a single-letter weekday.
 *
 * @param {string} dateStr - Date string in "YYYY-MM-DD" format.
 * @returns {string} Formatted string (e.g., "Jan" for first day, "02 M" for 2nd Monday).
 */
export function formatDayWithWeekdaySuffix(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();

  // If it's the first day of the month, return the short month name (e.g., "Jan")
  if (day === 1) {
    return d.toLocaleString(undefined, { month: "short" });
  }

  // Otherwise return zero‑padded day + single‑letter weekday (e.g., "02 M")
  const dayStr = day.toString().padStart(2, "0");
  const weekday = d.toLocaleString(undefined, { weekday: "narrow" });
  return `${dayStr} ${weekday}`;
}