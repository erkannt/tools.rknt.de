import { describe, it, expect } from 'vitest';
import { groupByIsoWeek, type WeekGroup } from './weekGrouping';
import type { GoldCard } from './types';

function createTestCard(id: string, datetime: string, comment: string): GoldCard {
	return { id, date: datetime, comment };
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
			createTestCard('card1', '2024-01-15T09:00:00.000Z', 'Monday'), // Week 3, 2024
			createTestCard('card2', '2024-01-17T14:30:00.000Z', 'Wednesday'), // Week 3, 2024
			createTestCard('card3', '2024-01-19T18:45:00.000Z', 'Friday') // Week 3, 2024
		],
		expected: [
			{
				week: 3,
				year: 2024,
				cards: [
					createTestCard('card1', '2024-01-15T09:00:00.000Z', 'Monday'),
					createTestCard('card2', '2024-01-17T14:30:00.000Z', 'Wednesday'),
					createTestCard('card3', '2024-01-19T18:45:00.000Z', 'Friday')
				]
			}
		],
		purpose: 'group cards from same ISO week together'
	},

	// Requirement: Group cards from different ISO weeks separately
	{
		cards: [
			createTestCard('card1', '2024-01-15T09:00:00.000Z', 'Monday'), // Week 3, 2024
			createTestCard('card2', '2024-01-22T14:30:00.000Z', 'Monday'), // Week 4, 2024
			createTestCard('card3', '2024-01-29T18:45:00.000Z', 'Monday') // Week 5, 2024
		],
		expected: [
			{
				week: 5,
				year: 2024,
				cards: [createTestCard('card3', '2024-01-29T18:45:00.000Z', 'Monday')]
			},
			{
				week: 4,
				year: 2024,
				cards: [createTestCard('card2', '2024-01-22T14:30:00.000Z', 'Monday')]
			},
			{
				week: 3,
				year: 2024,
				cards: [createTestCard('card1', '2024-01-15T09:00:00.000Z', 'Monday')]
			}
		],
		purpose: 'group cards from different ISO weeks separately and sort descending'
	},

	// Requirement: Handle cards spanning year boundaries
	{
		cards: [
			createTestCard('card1', '2023-12-31T23:59:00.000Z', 'Sunday'), // Week 52, 2023
			createTestCard('card2', '2024-01-01T00:00:00.000Z', 'Monday'), // Week 1, 2024
			createTestCard('card3', '2024-01-08T09:15:00.000Z', 'Monday') // Week 2, 2024
		],
		expected: [
			{
				week: 2,
				year: 2024,
				cards: [createTestCard('card3', '2024-01-08T09:15:00.000Z', 'Monday')]
			},
			{
				week: 1,
				year: 2024,
				cards: [createTestCard('card2', '2024-01-01T00:00:00.000Z', 'Monday')]
			},
			{
				week: 52,
				year: 2023,
				cards: [createTestCard('card1', '2023-12-31T23:59:00.000Z', 'Sunday')]
			}
		],
		purpose: 'handle cards spanning year boundaries and sort by year then week descending'
	},

	// Requirement: Handle cards in different years
	{
		cards: [
			createTestCard('card1', '2023-06-15T09:00:00.000Z', 'Thursday'), // Week 24, 2023
			createTestCard('card2', '2024-06-15T14:30:00.000Z', 'Saturday'), // Week 24, 2024
			createTestCard('card3', '2022-06-15T18:45:00.000Z', 'Wednesday') // Week 24, 2022
		],
		expected: [
			{
				week: 24,
				year: 2024,
				cards: [createTestCard('card2', '2024-06-15T14:30:00.000Z', 'Saturday')]
			},
			{
				week: 24,
				year: 2023,
				cards: [createTestCard('card1', '2023-06-15T09:00:00.000Z', 'Thursday')]
			},
			{
				week: 24,
				year: 2022,
				cards: [createTestCard('card3', '2022-06-15T18:45:00.000Z', 'Wednesday')]
			}
		],
		purpose: 'sort groups by year descending when weeks are the same'
	},

	// Requirement: Handle unsorted input cards (function should work with any order)
	{
		cards: [
			createTestCard('card1', '2024-01-29T09:00:00.000Z', 'Monday'), // Week 5, 2024
			createTestCard('card2', '2024-01-15T14:30:00.000Z', 'Monday'), // Week 3, 2024
			createTestCard('card3', '2024-01-22T18:45:00.000Z', 'Monday'), // Week 4, 2024
			createTestCard('card4', '2024-01-17T22:15:00.000Z', 'Wednesday') // Week 3, 2024
		],
		expected: [
			{
				week: 5,
				year: 2024,
				cards: [createTestCard('card1', '2024-01-29T09:00:00.000Z', 'Monday')]
			},
			{
				week: 4,
				year: 2024,
				cards: [createTestCard('card3', '2024-01-22T18:45:00.000Z', 'Monday')]
			},
			{
				week: 3,
				year: 2024,
				cards: [
					createTestCard('card2', '2024-01-15T14:30:00.000Z', 'Monday'),
					createTestCard('card4', '2024-01-17T22:15:00.000Z', 'Wednesday')
				]
			}
		],
		purpose: 'group unsorted input cards correctly'
	},

	// Requirement: Handle multiple cards in same week across different dates
	{
		cards: [
			createTestCard('card1', '2024-01-10T09:00:00.000Z', 'Wednesday'), // Week 2, 2024
			createTestCard('card2', '2024-01-14T23:59:00.000Z', 'Sunday'), // Week 2, 2024
			createTestCard('card3', '2024-01-08T00:00:00.000Z', 'Monday'), // Week 2, 2024
			createTestCard('card4', '2024-01-12T15:30:00.000Z', 'Friday') // Week 2, 2024
		],
		expected: [
			{
				week: 2,
				year: 2024,
				cards: [
					createTestCard('card1', '2024-01-10T09:00:00.000Z', 'Wednesday'),
					createTestCard('card2', '2024-01-14T23:59:00.000Z', 'Sunday'),
					createTestCard('card3', '2024-01-08T00:00:00.000Z', 'Monday'),
					createTestCard('card4', '2024-01-12T15:30:00.000Z', 'Friday')
				]
			}
		],
		purpose: 'preserve original order of cards within the same week'
	},

	// Requirement: Handle multiple cards on same day with different times
	{
		cards: [
			createTestCard('card1', '2024-01-15T09:00:00.000Z', 'Morning'), // Earlier
			createTestCard('card2', '2024-01-15T14:30:00.000Z', 'Afternoon'), // Later
			createTestCard('card3', '2024-01-15T18:45:00.000Z', 'Evening') // Latest
		],
		expected: [
			{
				week: 3,
				year: 2024,
				cards: [
					createTestCard('card1', '2024-01-15T09:00:00.000Z', 'Morning'),
					createTestCard('card2', '2024-01-15T14:30:00.000Z', 'Afternoon'),
					createTestCard('card3', '2024-01-15T18:45:00.000Z', 'Evening')
				]
			}
		],
		purpose: 'handle multiple cards on same day with different times'
	}
];

describe('groupByIsoWeek', () => {
	it.each(groupByIsoWeekTestCases)('$purpose', ({ cards, expected }) => {
		expect(groupByIsoWeek(cards)).toEqual(expected);
	});
});
