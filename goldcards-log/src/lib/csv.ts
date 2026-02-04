import type { GoldCard } from './types';

function escapeCsvField(value: string): string {
	if (value.includes('"') || value.includes(',') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

export function generateCsv(cards: GoldCard[]): string {
	const header = ['id', 'date', 'comment'].join(',');
	const rows = cards.map((c) =>
		[escapeCsvField(c.id), escapeCsvField(c.date), escapeCsvField(c.comment)].join(',')
	);
	return [header, ...rows].join('\n');
}

export function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let cur = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (inQuotes) {
			if (char === '"') {
				if (i + 1 < line.length && line[i + 1] === '"') {
					cur += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				cur += char;
			}
		} else {
			if (char === ',') {
				result.push(cur);
				cur = '';
			} else if (char === '"') {
				inQuotes = true;
			} else {
				cur += char;
			}
		}
	}
	result.push(cur);
	return result;
}

export function parseCsv(text: string): GoldCard[] {
	const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
	if (lines.length === 0) return [];

	// Skip header line
	const dataLines = lines.slice(1);
	const cards: GoldCard[] = [];

	for (const line of dataLines) {
		const fields = parseCsvLine(line);
		if (fields.length < 3) continue;
		const [id, date, comment] = fields;
		cards.push({ id, date, comment });
	}
	return cards;
}
