import type { DateString } from "../types";

/**
 * Gets the Monday of the ISO week for a given date.
 *
 * @param {Date} date - The input date.
 * @returns {Date} The Monday that starts the ISO week containing the given date.
 */
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
 * @param {number} year - The calendar year for which to generate dates.
 * @returns {string[]} An array of date strings formatted as "YYYY-MM-DD",
 *                     covering every day of the specified ISO year.
 */
export function getDatesForYear(year: number): DateString[] {
  // Determine the start Monday of the first ISO week (the week containing Jan 4)
  const startLocal = getMondayOfISOWeek(new Date(year, 0, 4));
  // Convert to a UTC midnight date to avoid DST issues
  const start = new Date(
    Date.UTC(
      startLocal.getFullYear(),
      startLocal.getMonth(),
      startLocal.getDate(),
    ),
  );

  // Determine the Monday after the last ISO week (the week containing Dec 28)
  const lastMondayLocal = getMondayOfISOWeek(new Date(year, 11, 28));
  const afterLastMondayLocal = new Date(lastMondayLocal);
  afterLastMondayLocal.setDate(afterLastMondayLocal.getDate() + 7); // exclusive upper bound
  // Convert to UTC midnight as well
  const end = new Date(
    Date.UTC(
      afterLastMondayLocal.getFullYear(),
      afterLastMondayLocal.getMonth(),
      afterLastMondayLocal.getDate(),
    ),
  );

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const dates: string[] = [];

  // Iterate in UTC, stepping one whole day at a time – this sidesteps DST anomalies
  for (let ts = start.getTime(); ts < end.getTime(); ts += ONE_DAY_MS) {
    const d = new Date(ts);
    dates.push(d.toISOString().split("T")[0]); // YYYY‑MM‑DD
  }

  return dates;
}