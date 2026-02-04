import { getISOWeekInfo } from './isoweek';
import type { GoldCard } from './types';

export interface WeekGroup {
	week: number;
	year: number;
	cards: GoldCard[];
}

export function groupByIsoWeek(sortedByDate: GoldCard[]): WeekGroup[] {
	const map: Record<string, WeekGroup> = {};

	for (const card of sortedByDate) {
		const { week, year } = getISOWeekInfo(card.date);
		const key = `${year}-${String(week).padStart(2, '0')}`;
		if (!map[key]) {
			map[key] = { week, year, cards: [] };
		}
		map[key].cards.push(card);
	}

	// Convert to array and sort descending by year then week
	return Object.values(map).sort((a, b) => {
		if (a.year !== b.year) return b.year - a.year;
		return b.week - a.week;
	});
}
