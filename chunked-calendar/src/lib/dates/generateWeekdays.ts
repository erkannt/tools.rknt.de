/**
 * Returns an array of 7 localized short weekday names (e.g., "Mon") starting with Monday.
 *
 * @returns {string[]} Short weekday names for Monday through Sunday.
 */
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