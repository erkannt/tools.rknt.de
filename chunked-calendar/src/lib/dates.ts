// Helper to get the Monday of the ISO week for a given date
function getMondayOfISOWeek(date: Date): Date {
  const jsDay = date.getDay(); // 0 (Sun) .. 6 (Sat)
  const isoDay = (jsDay + 6) % 7; // 0 (Mon) .. 6 (Sun)
  const monday = new Date(date);
  monday.setDate(date.getDate() - isoDay);
  return monday;
}

/**
 * Generates an array of date strings (YYYY-MM-DD) for every day in the ISO year.
 *
 * The function computes the start date as the Monday of the first ISO week
 * (the week containing January 4) and the end date as the Monday after the
 * last ISO week (the week containing December 28). It then iterates from the
 * start date up to, but not including, the end date, collecting each date
 * in ISO 8601 format.
 *
 * @param {number} year - The calendar year for which to generate dates.
 * @returns {string[]} An array of date strings formatted as "YYYY-MM-DD",
 *                     covering every day of the specified ISO year.
 */
export function getDatesForYear(year: number): string[] {
  // Start on the Monday of the first ISO week (the week containing Jan 4)
  const start = getMondayOfISOWeek(new Date(year, 0, 4));

  // End after the Sunday of the last ISO week (the week containing Dec 28)
  const lastMonday = getMondayOfISOWeek(new Date(year, 11, 28));
  const end = new Date(lastMonday);
  end.setDate(end.getDate() + 7); // exclusive upper bound (next Monday)

  let dates = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export function splitIntoQuarters(dates: string[]): string[][][] {
  const daysPerWeek = 7;
  const weeksPerQuarter = 13;
  const daysPerQuarter = daysPerWeek * weeksPerQuarter;

  const result: string[][][] = []; // quarters → weeks → days

  let i = 0;
  // Process full quarters (13 weeks each)
  for (; i + daysPerQuarter <= dates.length; i += daysPerQuarter) {
    const quarterDays = dates.slice(i, i + daysPerQuarter);
    const weeks: string[][] = [];

    for (let j = 0; j < quarterDays.length; j += daysPerWeek) {
      weeks.push(quarterDays.slice(j, j + daysPerWeek));
    }

    result.push(weeks);
  }

  // If there are leftover days (i.e., a 53rd week), add them to the fourth quarter
  const remainingDays = dates.length - i;
  if (remainingDays > 0) {
    const extraWeek = dates.slice(i); // should be exactly 7 days
    if (result.length === 0) {
      // Edge case: no quarters created yet
      result.push([extraWeek]);
    } else {
      // Append the extra week to the last quarter (fourth quarter)
      result[result.length - 1].push(extraWeek);
    }
  }

  return result;
}

export function generateWeekdays(): string[] {
  // Generate localized short weekday names using the browser's locale
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
  });
  // Reference Monday (2021‑01‑04) – ensures we have a full week starting on Monday
  const reference = new Date(Date.UTC(2021, 0, 4));
  return Array.from({ length: 7 }, (_, i) =>
    formatter.format(new Date(reference.getTime() + i * 24 * 60 * 60 * 1000)),
  );
}

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

export function isFirstOfMonth(day: string): boolean {
  const d = new Date(day);
  return d.getDate() === 1;
}
