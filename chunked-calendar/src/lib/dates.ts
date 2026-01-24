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

/**
 * Splits an array of date strings (YYYY-MM-DD) into quarters, each consisting of up to 13 weeks.
 *
 * @param {string[]} dates - An array of date strings formatted as "YYYY-MM-DD".
 * @returns {string[][][]} A three-dimensional array where the outermost array represents quarters,
 *                          the middle arrays represent weeks within each quarter, and the innermost
 *                          arrays represent individual days within each week.
 */
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

export function splitIntoQuartersWithChunks(dates: string[]): string[][][] {
  const daysPerWeek = 7;

  // Split the flat list of dates into weeks (arrays of 7 days)
  const weeks: string[][] = [];
  for (let i = 0; i < dates.length; i += daysPerWeek) {
    weeks.push(dates.slice(i, i + daysPerWeek));
  }

  const totalWeeks = weeks.length; // typically 52, sometimes 53

  const result: string[][][] = []; // quarters → chunks → days
  let weekIdx = 0;

  // Build four quarters
  for (let q = 0; q < 4; q++) {
    const quarterChunks: string[][] = [];

    // Each quarter has four chunks
    for (let c = 0; c < 4; c++) {
      // Determine how many weeks belong in this chunk
      let weeksInChunk: number;
      if (c < 3) {
        // First three chunks: four weeks each
        weeksInChunk = 4;
      } else {
        // Last chunk of the quarter
        if (q === 3) {
          // In the final quarter, give it two weeks if the year has 53 weeks
          weeksInChunk = totalWeeks === 53 ? 2 : 1;
        } else {
          weeksInChunk = 1;
        }
      }

      // Collect the days for the chunk, flattening the weeks
      const chunkDays: string[] = [];
      for (let w = 0; w < weeksInChunk && weekIdx < weeks.length; w++) {
        chunkDays.push(...weeks[weekIdx]);
        weekIdx++;
      }

      quarterChunks.push(chunkDays);
    }

    result.push(quarterChunks);
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

export function isFirstOfMonth(day: string): boolean {
  const d = new Date(day);
  return d.getDate() === 1;
}
