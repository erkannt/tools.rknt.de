import { describe, it, expect } from 'vitest';
import { groupByIsoWeek, type WeekGroup } from './weekGrouping';
import type { GoldCard } from './types';

function createTestCard(id: string, date: string, comment: string): GoldCard {
	return { id, date, comment };
}

interface GroupByIsoWeekTestCase {
	cards: GoldCard[];
	expected: WeekGroup[];
	purpose: string;
}

const groupByIsoWeekTestCases: GroupByIsoWeekTestCase[] = [
	// Requirement: Return empty array for empty input
	{
		cards: [],
		expected: [],
		purpose: 'return empty array when no cards provided'
	},

	// Requirement: Group cards from same ISO week together
	{
		cards: [
			createTestCard('card1', '2024-01-15', 'Monday'), // Week 3, 2024
			createTestCard('card2', '2024-01-17', 'Wednesday'), // Week 3, 2024
			createTestCard('card3', '2024-01-19', 'Friday') // Week 3, 2024
		],
		expected: [
			{
				week: 3,
				year: 2024,
				cards: [
					createTestCard('card1', '2024-01-15', 'Monday'),
					createTestCard('card2', '2024-01-17', 'Wednesday'),
					createTestCard('card3', '2024-01-19', 'Friday')
				]
			}
		],
		purpose: 'group cards from same ISO week together'
	},

	// Requirement: Group cards from different ISO weeks separately
	{
		cards: [
			createTestCard('card1', '2024-01-15', 'Monday'), // Week 3, 2024
			createTestCard('card2', '2024-01-22', 'Monday'), // Week 4, 2024
			createTestCard('card3', '2024-01-29', 'Monday') // Week 5, 2024
		],
		expected: [
			{
				week: 5,
				year: 2024,
				cards: [createTestCard('card3', '2024-01-29', 'Monday')]
			},
			{
				week: 4,
				year: 2024,
				cards: [createTestCard('card2', '2024-01-22', 'Monday')]
			},
			{
				week: 3,
				year: 2024,
				cards: [createTestCard('card1', '2024-01-15', 'Monday')]
			}
		],
		purpose: 'group cards from different ISO weeks separately and sort descending'
	},

	// Requirement: Handle cards spanning year boundaries
	{
		cards: [
			createTestCard('card1', '2023-12-31', 'Sunday'), // Week 52, 2023
			createTestCard('card2', '2024-01-01', 'Monday'), // Week 1, 2024
			createTestCard('card3', '2024-01-08', 'Monday') // Week 2, 2024
		],
		expected: [
			{
				week: 2,
				year: 2024,
				cards: [createTestCard('card3', '2024-01-08', 'Monday')]
			},
			{
				week: 1,
				year: 2024,
				cards: [createTestCard('card2', '2024-01-01', 'Monday')]
			},
			{
				week: 52,
				year: 2023,
				cards: [createTestCard('card1', '2023-12-31', 'Sunday')]
			}
		],
		purpose: 'handle cards spanning year boundaries and sort by year then week descending'
	},

	// Requirement: Handle cards in different years
	{
		cards: [
			createTestCard('card1', '2023-06-15', 'Thursday'), // Week 24, 2023
			createTestCard('card2', '2024-06-15', 'Saturday'), // Week 24, 2024
			createTestCard('card3', '2022-06-15', 'Wednesday') // Week 24, 2022
		],
		expected: [
			{
				week: 24,
				year: 2024,
				cards: [createTestCard('card2', '2024-06-15', 'Saturday')]
			},
			{
				week: 24,
				year: 2023,
				cards: [createTestCard('card1', '2023-06-15', 'Thursday')]
			},
			{
				week: 24,
				year: 2022,
				cards: [createTestCard('card3', '2022-06-15', 'Wednesday')]
			}
		],
		purpose: 'sort groups by year descending when weeks are the same'
	},

	// Requirement: Handle unsorted input cards (function should work with any order)
	{
		cards: [
			createTestCard('card1', '2024-01-29', 'Monday'), // Week 5, 2024
			createTestCard('card2', '2024-01-15', 'Monday'), // Week 3, 2024
			createTestCard('card3', '2024-01-22', 'Monday'), // Week 4, 2024
			createTestCard('card4', '2024-01-17', 'Wednesday') // Week 3, 2024
		],
		expected: [
			{
				week: 5,
				year: 2024,
				cards: [createTestCard('card1', '2024-01-29', 'Monday')]
			},
			{
				week: 4,
				year: 2024,
				cards: [createTestCard('card3', '2024-01-22', 'Monday')]
			},
			{
				week: 3,
				year: 2024,
				cards: [
					createTestCard('card2', '2024-01-15', 'Monday'),
					createTestCard('card4', '2024-01-17', 'Wednesday')
				]
			}
		],
		purpose: 'group unsorted input cards correctly'
	},

	// Requirement: Handle multiple cards in same week across different dates
	{
		cards: [
			createTestCard('card1', '2024-01-10', 'Wednesday'), // Week 2, 2024
			createTestCard('card2', '2024-01-14', 'Sunday'), // Week 2, 2024
			createTestCard('card3', '2024-01-08', 'Monday'), // Week 2, 2024
			createTestCard('card4', '2024-01-12', 'Friday') // Week 2, 2024
		],
		expected: [
			{
				week: 2,
				year: 2024,
				cards: [
					createTestCard('card1', '2024-01-10', 'Wednesday'),
					createTestCard('card2', '2024-01-14', 'Sunday'),
					createTestCard('card3', '2024-01-08', 'Monday'),
					createTestCard('card4', '2024-01-12', 'Friday')
				]
			}
		],
		purpose: 'preserve original order of cards within the same week'
	}
];

describe('groupByIsoWeek', () => {
	it.each(groupByIsoWeekTestCases)('$purpose', ({ cards, expected }) => {
		expect(groupByIsoWeek(cards)).toEqual(expected);
	});
});
