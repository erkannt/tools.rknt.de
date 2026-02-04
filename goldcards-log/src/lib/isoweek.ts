export function getISOWeekInfo(dateStr: string): { week: number; year: number } {
	/** Compute ISO week number and ISO year for a given YYYY‑MM‑DD date string */
	const date = new Date(dateStr);
	// Thursday of the current week determines the ISO year
	const thursday = new Date(date);
	const day = (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
	thursday.setDate(date.getDate() + 3 - day);
	const year = thursday.getFullYear();

	// January 4th is always in week 1
	const jan4 = new Date(year, 0, 4);
	const jan4Day = (jan4.getDay() + 6) % 7;
	const firstThursday = new Date(jan4);
	firstThursday.setDate(jan4.getDate() + 3 - jan4Day);

	const week =
		1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
	return { week, year };
}
