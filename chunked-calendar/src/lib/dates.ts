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
