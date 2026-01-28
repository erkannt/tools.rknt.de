import { describe, it, expect } from 'vitest';
import { formatDate } from './dateUtils';

interface FormatDateTestCase {
	input: string;
	expected: string;
	purpose: string;
}

const formatDateTestCases: FormatDateTestCase[] = [
	{
		input: '2024-01-08', // Monday
		expected: 'Mon',
		purpose: 'format Monday date correctly'
	},
	{
		input: '2024-01-09', // Tuesday
		expected: 'Tue',
		purpose: 'format Tuesday date correctly'
	},
	{
		input: '2024-01-10', // Wednesday
		expected: 'Wed',
		purpose: 'format Wednesday date correctly'
	},
	{
		input: '2024-01-11', // Thursday
		expected: 'Thu',
		purpose: 'format Thursday date correctly'
	},
	{
		input: '2024-01-12', // Friday
		expected: 'Fri',
		purpose: 'format Friday date correctly'
	},
	{
		input: '2024-01-13', // Saturday
		expected: 'Sat',
		purpose: 'format Saturday date correctly'
	},
	{
		input: '2024-01-14', // Sunday
		expected: 'Sun',
		purpose: 'format Sunday date correctly'
	},
	{
		input: '2020-02-29', // Leap day (Saturday)
		expected: 'Sat',
		purpose: 'handle leap year dates correctly'
	},
	{
		input: '2023-12-31', // Year end (Sunday)
		expected: 'Sun',
		purpose: 'handle year end dates correctly'
	},
	{
		input: '2024-01-01', // Year start (Monday)
		expected: 'Mon',
		purpose: 'handle year start dates correctly'
	}
];

describe('formatDate', () => {
	it.each(formatDateTestCases)('should $purpose', ({ input, expected }) => {
		expect(formatDate(input)).toBe(expected);
	});
});
