import { describe, it, expect } from 'vitest';
import { calculateBudget } from './budget';
import type { GoldCard, BudgetAdjustment } from './types';
import { v4 as uuidv4 } from 'uuid';

function cardOn(date: string, time: string = '12:00:00.000Z', comment: string = 'test'): GoldCard {
	return { id: uuidv4(), date: `${date}T${time}`, comment };
}

function adjustmentOn(
	date: string,
	adjustment: number,
	comment: string = 'test'
): BudgetAdjustment {
	return { id: uuidv4(), adjustment, comment, date: `${date}T12:00:00.000Z` };
}

interface CalculateBudgetTestCase {
	cards: GoldCard[];
	currentDate: string;
	expected: number;
	purpose: string;
}

interface CalculateBudgetWithAdjustmentsTestCase {
	cards: GoldCard[];
	adjustments: BudgetAdjustment[];
	currentDate: string;
	expected: number;
	purpose: string;
}

const calculateBudgetTestCases: CalculateBudgetTestCase[] = [
	// Requirement 1: Budget is 5 if no goldcards have been logged
	{
		cards: [],
		currentDate: '2024-01-15',
		expected: 5,
		purpose: 'return 5 when no goldcards have been logged'
	},

	// Requirement 2: Budget is reduced by one for each goldcard taken
	{
		cards: [cardOn('2024-01-15')],
		currentDate: '2024-01-15',
		expected: 4,
		purpose: 'first goldcard taken (5 - 1)'
	},
	{
		cards: [
			cardOn('2024-01-15'), // Monday
			cardOn('2024-01-16'), // Tuesday
			cardOn('2024-01-17') // Wednesday
		],
		currentDate: '2024-01-17', // Wednesday
		expected: 2,
		purpose: 'three goldcards taken in first week (5 - 3)'
	},

	// Requirement 3: For each ISO calendar week that has started since the first goldcard was logged, increase the budget by five
	{
		cards: [cardOn('2024-01-15')], // Monday
		currentDate: '2024-01-22', // Monday, one week later
		expected: 9,
		purpose: 'one card taken, second week started (5 + 5 - 1)'
	},
	{
		cards: [cardOn('2024-01-15')], // Monday
		currentDate: '2024-01-29', // Monday, two weeks later
		expected: 14,
		purpose: 'one card taken, third week started (5 + 10 - 1)'
	},
	{
		cards: [cardOn('2024-01-15'), cardOn('2024-01-20')],
		currentDate: '2024-01-22', // Monday, one week after first card
		expected: 8,
		purpose: 'two cards and one week passed (5 + 5 - 2)'
	},
	{
		cards: [cardOn('2024-01-15')], // Monday
		currentDate: '2024-01-21', // Sunday
		expected: 4,
		purpose: 'less than one week has passed since first card (5 - 1)'
	},
	{
		cards: [cardOn('2024-01-15'), cardOn('2024-01-18'), cardOn('2024-01-25')],
		currentDate: '2024-02-05',
		expected: 17,
		purpose: 'three cards across three weeks and fourth week started (5 + 15 - 3)'
	},

	// Requirement: Test with different times on same day for sorting
	{
		cards: [cardOn('2024-01-15', '09:00:00.000Z'), cardOn('2024-01-15', '14:30:00.000Z')],
		currentDate: '2024-01-17',
		expected: 3,
		purpose: 'two cards on same day with different times (5 - 2)'
	}
];

const calculateBudgetWithAdjustmentsTestCases: CalculateBudgetWithAdjustmentsTestCase[] = [
	// Requirement 4: Budget adjustments directly affect the budget
	{
		cards: [],
		adjustments: [adjustmentOn('2024-01-15', 3, 'bonus')],
		currentDate: '2024-01-15',
		expected: 8,
		purpose: 'no cards, +3 adjustment (5 + 3)'
	},
	{
		cards: [],
		adjustments: [adjustmentOn('2024-01-15', -2, 'deduction')],
		currentDate: '2024-01-15',
		expected: 3,
		purpose: 'no cards, -2 adjustment (5 - 2)'
	},
	{
		cards: [cardOn('2024-01-15')],
		adjustments: [adjustmentOn('2024-01-15', 5, 'extra')],
		currentDate: '2024-01-15',
		expected: 9,
		purpose: 'one card taken, +5 adjustment (5 - 1 + 5)'
	},
	{
		cards: [cardOn('2024-01-15')],
		adjustments: [adjustmentOn('2024-01-15', -3, 'penalty')],
		currentDate: '2024-01-15',
		expected: 1,
		purpose: 'one card taken, -3 adjustment (5 - 1 - 3)'
	},
	{
		cards: [cardOn('2024-01-15')],
		adjustments: [adjustmentOn('2024-01-15', 2, 'first'), adjustmentOn('2024-01-16', 3, 'second')],
		currentDate: '2024-01-17',
		expected: 9,
		purpose: 'one card, +2 and +3 adjustments (5 - 1 + 5)'
	}
];

describe('calculateBudget', () => {
	it.each(calculateBudgetTestCases)('$purpose', ({ cards, currentDate, expected }) => {
		expect(calculateBudget(cards, currentDate)).toBe(expected);
	});

	it.each(calculateBudgetWithAdjustmentsTestCases)(
		'$purpose',
		({ cards, adjustments, currentDate, expected }) => {
			expect(calculateBudget(cards, adjustments, currentDate)).toBe(expected);
		}
	);
});
