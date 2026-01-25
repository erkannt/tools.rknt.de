/**
 * Checks if a given date string represents the first day of the month.
 *
 * @param {string} day - Date string in "YYYY-MM-DD" format.
 * @returns {boolean} True if the date is the first day of the month, false otherwise.
 */
export function isFirstOfMonth(day: string): boolean {
  const d = new Date(day);
  return d.getDate() === 1;
}