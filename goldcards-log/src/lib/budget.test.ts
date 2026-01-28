import { describe, it, expect } from 'vitest';
import { calculateBudget } from './budget';
import type { GoldCard } from './types';

interface CalculateBudgetTestCase {
	cards: GoldCard[];
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
	{
		cards: [],
		currentDate: '2024-03-10',
		expected: 5,
		purpose: 'return 5 when no goldcards have been logged (different date)'
	},

	// Requirement 2: Budget is reduced by one for each goldcard taken
	{
		cards: [{ id: '1', date: '2024-01-15', comment: 'test' }],
		currentDate: '2024-01-15',
		expected: 4,
		purpose: 'return 4 when one goldcard taken (5 - 1)'
	},
	{
		cards: [
			{ id: '1', date: '2024-01-15', comment: 'test' },
			{ id: '2', date: '2024-01-16', comment: 'test' },
			{ id: '3', date: '2024-01-17', comment: 'test' }
		],
		currentDate: '2024-01-17',
		expected: 2,
		purpose: 'return 2 when three goldcards taken same week (5 - 3)'
	},

	// Requirement 3: For each ISO calendar week that has started since the first goldcard was logged, increase the budget by five
	{
		cards: [{ id: '1', date: '2024-01-15', comment: 'test' }],
		currentDate: '2024-01-22',
		expected: 9,
		purpose: 'return 9 when one card and one week passed (5 + 5 - 1)'
	},
	{
		cards: [{ id: '1', date: '2024-01-15', comment: 'test' }],
		currentDate: '2024-01-29',
		expected: 14,
		purpose: 'return 14 when one card and two weeks passed (5 + 10 - 1)'
	},
	{
		cards: [
			{ id: '1', date: '2024-01-15', comment: 'test' },
			{ id: '2', date: '2024-01-20', comment: 'test' }
		],
		currentDate: '2024-01-22',
		expected: 8,
		purpose: 'return 8 when two cards and one week passed (5 + 5 - 2)'
	},

	// Edge cases around week boundaries
	{
		cards: [{ id: '1', date: '2024-01-15', comment: 'test' }],
		currentDate: '2024-01-21',
		expected: 4,
		purpose: 'return 4 when less than one week has passed (5 - 1)'
	},
	{
		cards: [{ id: '1', date: '2024-01-15', comment: 'test' }],
		currentDate: '2024-01-22',
		expected: 9,
		purpose: 'return 9 when exactly one week has passed (5 + 5 - 1)'
	},
	{
		cards: [
			{ id: '1', date: '2024-01-15', comment: 'test' },
			{ id: '2', date: '2024-01-22', comment: 'test' }
		],
		currentDate: '2024-01-29',
		expected: 13,
		purpose: 'return 13 with cards spanning two weeks (5 + 10 - 2)'
	},

	// Multiple cards across multiple weeks
	{
		cards: [
			{ id: '1', date: '2024-01-15', comment: 'test' },
			{ id: '2', date: '2024-01-18', comment: 'test' },
			{ id: '3', date: '2024-01-25', comment: 'test' }
		],
		currentDate: '2024-02-05',
		expected: 17,
		purpose: 'return 17 with three cards across three weeks (5 + 15 - 3)'
	}
];

describe('calculateBudget', () => {
	it.each(calculateBudgetTestCases)('should $purpose', ({ cards, currentDate, expected }) => {
		expect(calculateBudget(cards, currentDate)).toBe(expected);
	});
});
