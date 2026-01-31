import { describe, it, expect } from 'vitest';
import { getISOWeekInfo } from './isoweek';

interface GetISOWeekInfoTestCase {
	input: string;
	expected: { week: number; year: number };
	purpose: string;
}

const getISOWeekInfoTestCases: GetISOWeekInfoTestCase[] = [
	// Requirement: Calculate ISO week for regular dates
	{
		input: '2024-01-15', // Monday, week 3 of 2024
		expected: { week: 3, year: 2024 },
		purpose: 'calculate ISO week for Monday in January'
	},
	{
		input: '2024-01-10', // Wednesday, week 2 of 2024
		expected: { week: 2, year: 2024 },
		purpose: 'calculate ISO week for Wednesday in January'
	},
	{
		input: '2024-06-15', // Saturday, week 24 of 2024
		expected: { week: 24, year: 2024 },
		purpose: 'calculate ISO week for Saturday in June'
	},

	// Requirement: Handle year boundaries - dates in ISO year 2023 but calendar year 2024
	{
		input: '2024-01-01', // Monday, belongs to week 1 of 2024
		expected: { week: 1, year: 2024 },
		purpose: 'handle January 1st that belongs to ISO week 1 of current year'
	},
	{
		input: '2023-12-31', // Sunday, belongs to week 52 of 2023
		expected: { week: 52, year: 2023 },
		purpose: 'handle December 31st that belongs to last week of same ISO year'
	},
	{
		input: '2023-12-30', // Saturday, belongs to week 52 of 2023
		expected: { week: 52, year: 2023 },
		purpose: 'handle late December that belongs to last week of same ISO year'
	},
	{
		input: '2023-12-29', // Friday, belongs to week 52 of 2023
		expected: { week: 52, year: 2023 },
		purpose: 'handle late December that belongs to last week of same ISO year'
	},

	// Requirement: Handle dates that at the ISO year boundary
	{
		input: '2023-01-01', // Sunday, belongs to week 52 of 2022
		expected: { week: 52, year: 2022 },
		purpose: 'handle January 1st that belongs to last week of previous ISO year'
	},
	{
		input: '2022-01-01', // Saturday, belongs to week 52 of 2021
		expected: { week: 52, year: 2021 },
		purpose: 'handle January 1st that belongs to last week of previous ISO year'
	},
	{
		input: '2022-12-31', // Saturday, belongs to week 52 of 2022
		expected: { week: 52, year: 2022 },
		purpose: 'handle December 31st that belongs to last week of current ISO year'
	},
	{
		input: '2020-12-31', // Thursday, belongs to week 53 of 2020
		expected: { week: 53, year: 2020 },
		purpose: 'handle December 31st that belongs to week 53 of current ISO year'
	},

	// Requirement: Handle leap years
	{
		input: '2020-02-29', // Saturday, leap day in week 9 of 2020
		expected: { week: 9, year: 2020 },
		purpose: 'handle February 29th in leap year'
	},
	{
		input: '2024-02-29', // Thursday, leap day in week 9 of 2024
		expected: { week: 9, year: 2024 },
		purpose: 'handle February 29th in leap year'
	},

	// Requirement: Handle first week of the year
	{
		input: '2024-01-08', // Monday, first Monday of 2024, week 2
		expected: { week: 2, year: 2024 },
		purpose: 'handle first Monday of January that is in week 2'
	},
	{
		input: '2023-01-02', // Monday, first Monday of 2023, week 1
		expected: { week: 1, year: 2023 },
		purpose: 'handle first Monday of January that is in week 1'
	},

	// Requirement: Handle last weeks of the year
	{
		input: '2024-12-29', // Sunday, week 52 of 2024
		expected: { week: 52, year: 2024 },
		purpose: 'handle late December in week 52'
	},
	{
		input: '2024-12-31', // Tuesday, week 1 of 2025
		expected: { week: 1, year: 2025 },
		purpose: 'handle December 31st that belongs to first week of next ISO year'
	}
];

describe('getISOWeekInfo', () => {
	it.each(getISOWeekInfoTestCases)('$purpose', ({ input, expected }) => {
		expect(getISOWeekInfo(input)).toEqual(expected);
	});
});
