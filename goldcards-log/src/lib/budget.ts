import type { GoldCard } from './types';

function calculateWeeksPassed(firstDate: string): number {
	const start = new Date(firstDate);
	const now = new Date();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	const diff = now.getTime() - start.getTime();
	return Math.max(0, Math.floor(diff / msPerWeek));
}

export function calculateBudget(cards: GoldCard[]): number {
	if (cards.length === 0) {
		return 5; // Initial budget when no cards exist
	}

	// Get the earliest date (last in sorted array)
	const sortedCards = [...cards].sort((a, b) => b.date.localeCompare(a.date));
	const firstDate = sortedCards[sortedCards.length - 1].date;
	const weeksPassed = calculateWeeksPassed(firstDate);

	return 5 + weeksPassed * 5 - cards.length;
}
