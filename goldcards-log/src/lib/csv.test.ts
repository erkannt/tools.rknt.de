import { describe, it, expect } from 'vitest';
import { generateCsv, parseCsv } from './csv';
import type { GoldCard } from './types';

function createTestCard(id: string, datetime: string, comment: string): GoldCard {
	return { id, date: datetime, comment };
}

interface GenerateCsvTestCase {
	cards: GoldCard[];
	expected: string;
	purpose: string;
}

const generateCsvTestCases: GenerateCsvTestCase[] = [
	// Requirement: Generate CSV with header and empty data
	{
		cards: [],
		expected: 'id,date,comment',
		purpose: 'generate CSV with header only when no cards provided'
	},

	// Requirement: Generate CSV with single card
	{
		cards: [createTestCard('card1', '2024-01-15T12:00:00.000Z', 'test comment')],
		expected: 'id,date,comment\ncard1,2024-01-15T12:00:00.000Z,test comment',
		purpose: 'generate CSV with single card'
	},

	// Requirement: Generate CSV with multiple cards
	{
		cards: [
			createTestCard('card1', '2024-01-15T12:00:00.000Z', 'first comment'),
			createTestCard('card2', '2024-01-16T14:30:00.000Z', 'second comment')
		],
		expected:
			'id,date,comment\ncard1,2024-01-15T12:00:00.000Z,first comment\ncard2,2024-01-16T14:30:00.000Z,second comment',
		purpose: 'generate CSV with multiple cards'
	},

	// Requirement: Escape special characters in CSV fields
	{
		cards: [
			createTestCard('card,with,commas', '2024-01-15T12:00:00.000Z', 'comment with "quotes"')
		],
		expected:
			'id,date,comment\n"card,with,commas",2024-01-15T12:00:00.000Z,"comment with ""quotes"""',
		purpose: 'escape commas and quotes in CSV fields'
	}
];

interface ParseCsvTestCase {
	input: string;
	expected: GoldCard[];
	purpose: string;
}

const parseCsvTestCases: ParseCsvTestCase[] = [
	// Requirement: Parse empty CSV
	{
		input: '',
		expected: [],
		purpose: 'return empty array for empty input'
	},

	// Requirement: Parse CSV with header only
	{
		input: 'id,date,comment',
		expected: [],
		purpose: 'return empty array when only header is present'
	},

	// Requirement: Parse CSV with single card
	{
		input: 'id,date,comment\ncard1,2024-01-15T12:00:00.000Z,test comment',
		expected: [createTestCard('card1', '2024-01-15T12:00:00.000Z', 'test comment')],
		purpose: 'parse CSV with single card'
	},

	// Requirement: Parse CSV with multiple cards
	{
		input:
			'id,date,comment\ncard1,2024-01-15T12:00:00.000Z,first comment\ncard2,2024-01-16T14:30:00.000Z,second comment',
		expected: [
			createTestCard('card1', '2024-01-15T12:00:00.000Z', 'first comment'),
			createTestCard('card2', '2024-01-16T14:30:00.000Z', 'second comment')
		],
		purpose: 'parse CSV with multiple cards'
	},

	// Requirement: Parse CSV with quoted fields
	{
		input: 'id,date,comment\n"card,with,commas",2024-01-15T12:00:00.000Z,"comment with ""quotes"""',
		expected: [
			createTestCard('card,with,commas', '2024-01-15T12:00:00.000Z', 'comment with "quotes"')
		],
		purpose: 'parse CSV with quoted fields containing commas and escaped quotes'
	},

	// Requirement: Skip malformed lines (less than 3 fields)
	{
		input:
			'id,date,comment\ncard1,2024-01-15T12:00:00.000Z\ncard2,2024-01-16T14:30:00.000Z,valid comment\ncard3,2024-01-17T09:15:00.000Z',
		expected: [createTestCard('card2', '2024-01-16T14:30:00.000Z', 'valid comment')],
		purpose: 'skip lines with insufficient fields and parse valid lines'
	}
];

describe('generateCsv', () => {
	it.each(generateCsvTestCases)('$purpose', ({ cards, expected }) => {
		expect(generateCsv(cards)).toBe(expected);
	});
});

describe('parseCsv', () => {
	it.each(parseCsvTestCases)('$purpose', ({ input, expected }) => {
		expect(parseCsv(input)).toEqual(expected);
	});
});
