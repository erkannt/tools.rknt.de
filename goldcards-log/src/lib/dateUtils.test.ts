import { describe, it, expect } from 'vitest';
import { formatDate } from './dateUtils';

interface FormatDateTestCase {
	input: string;
	expected: string;
	purpose: string;
}

const formatDateTestCases: FormatDateTestCase[] = [
	{
		input: '2024-01-08T12:00:00.000Z', // Monday
		expected: 'Mon',
		purpose: 'format Monday datetime correctly'
	},
	{
		input: '2024-01-09T15:30:00.000Z', // Tuesday
		expected: 'Tue',
		purpose: 'format Tuesday datetime correctly'
	},
	{
		input: '2024-01-10T09:15:00.000Z', // Wednesday
		expected: 'Wed',
		purpose: 'format Wednesday datetime correctly'
	},
	{
		input: '2024-01-11T22:45:00.000Z', // Thursday
		expected: 'Thu',
		purpose: 'format Thursday datetime correctly'
	},
	{
		input: '2024-01-12T01:30:00.000Z', // Friday
		expected: 'Fri',
		purpose: 'format Friday datetime correctly'
	},
	{
		input: '2024-01-13T18:20:00.000Z', // Saturday
		expected: 'Sat',
		purpose: 'format Saturday datetime correctly'
	},
	{
		input: '2024-01-14T23:59:00.000Z', // Sunday
		expected: 'Sun',
		purpose: 'format Sunday datetime correctly'
	},
	{
		input: '2020-02-29T12:00:00.000Z', // Leap day (Saturday)
		expected: 'Sat',
		purpose: 'handle leap year datetime correctly'
	},
	{
		input: '2023-12-31T23:59:00.000Z', // Year end (Sunday)
		expected: 'Sun',
		purpose: 'handle year end datetime correctly'
	},
	{
		input: '2024-01-01T00:00:00.000Z', // Year start (Monday)
		expected: 'Mon',
		purpose: 'handle year start datetime correctly'
	}
];

describe('formatDate', () => {
	it.each(formatDateTestCases)('should $purpose', ({ input, expected }) => {
		expect(formatDate(input)).toBe(expected);
	});
});
