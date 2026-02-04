import type { DateString, Quarter } from "../types";

/**
 * Splits an array of date strings (YYYY-MM-DD) into quarters, containing weeks, containing days
 *
 * Quarters have 13 weeks. In ISO years with 53 weeks the last quarter will have 14 weeks.
 *
 * @param {string[]} dates - An array of date strings formatted as "YYYY-MM-DD".
 * @returns {string[][][]} Outermost array represents quarters,
 *                         the middle arrays represent weeks within each quarter,
 *                         the inner contains days for each week.
 */
export function splitIntoQuarters(dates: DateString[]): Quarter[] {
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