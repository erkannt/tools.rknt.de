import type { GoldCard, BudgetAdjustment } from './types';

function calculateWeeksPassed(firstDate: string, currentDate: string | Date = new Date()): number {
	const start = new Date(firstDate);
	const now = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	const diff = now.getTime() - start.getTime();
	return Math.max(0, Math.floor(diff / msPerWeek));
}

export function calculateBudget(
	cards: GoldCard[],
	adjustmentsOrDate?: BudgetAdjustment[] | string | Date,
	currentDate?: string | Date
): number {
	let adjustments: BudgetAdjustment[] = [];
	let effectiveCurrentDate: string | Date | undefined;

	if (Array.isArray(adjustmentsOrDate)) {
		adjustments = adjustmentsOrDate;
		effectiveCurrentDate = currentDate;
	} else {
		effectiveCurrentDate = adjustmentsOrDate;
	}

	const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.adjustment, 0);

	if (cards.length === 0) {
		return 5 + totalAdjustment;
	}

	// Get the earliest date (last in sorted array)
	const sortedCards = [...cards].sort((a, b) => b.date.localeCompare(a.date));
	const firstDate = sortedCards[sortedCards.length - 1].date;

	// For budget calculation, use only the date portion (ignore time)
	const firstDateOnly = firstDate.split('T')[0];
	const weeksPassed = calculateWeeksPassed(firstDateOnly, effectiveCurrentDate);

	return 5 + weeksPassed * 5 - cards.length + totalAdjustment;
}
