import type { DateString, QuarterWithChunks } from "../types";

/**
 * Splits an array of date strings into quarters with 4 chunks per quarter.
 *
 * Each quarter contains 3 chunks of 4 weeks and last chunk consisting of a single week.
 * In ISO years with 53 weeks the last chunk of the last quarter has two weeks.
 *
 * @param {string[]} dates - An array of date strings formatted as "YYYY-MM-DD".
 * @returns {string[][][]} A three-dimensional array where the outermost array represents quarters,
 *                          the middle arrays represent chunks within each quarter, and the innermost
 *                          arrays represent individual days within each chunk.
 */
export function splitIntoQuartersWithChunks(dates: DateString[]): QuarterWithChunks[] {
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