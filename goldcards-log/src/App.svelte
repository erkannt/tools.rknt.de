<script lang="ts">
	import { getISOWeekInfo } from '$lib/isoweek';
	import { LocalStorage } from '$lib/localStorage.svelte';
	import Layout from './Layout.svelte';

	interface GoldCard {
		id: string;
		date: string;
		comment: string;
	}

	const goldcards = new LocalStorage<GoldCard[]>('goldcards', []);
	const sortedByDate: GoldCard[] = $derived(
		[...goldcards.current].sort((a, b) => b.date.localeCompare(a.date))
	);
	const byIsoWeek = $derived(groupByIsoWeek(sortedByDate));

	// Determine the earliest logged goldcard date
	const firstGoldcardDate = $derived.by(() => {
		if (goldcards.current.length === 0) {
			return new Date().toISOString().split('T')[0];
		}
		return sortedByDate[sortedByDate.length - 1].date;
	});

	// Number of whole weeks that have elapsed since that first week
	const weeksPassed = $derived.by(() => {
		const start = new Date(firstGoldcardDate);
		const now = new Date();
		const msPerWeek = 7 * 24 * 60 * 60 * 1000;
		const diff = now.getTime() - start.getTime();
		return Math.max(0, Math.floor(diff / msPerWeek));
	});

	const goldcardBudget = $derived(5 + weeksPassed * 5 - goldcards.current.length);

	let newDate: string = $state(new Date().toISOString().split('T')[0]);
	let newComment: string = $state('');

	function addGoldCard() {
		if (!newComment.trim()) {
			return;
		}
		const newId = crypto.randomUUID();
		goldcards.current.push({
			id: newId,
			date: newDate,
			comment: newComment.trim()
		});
		// Reset comment field (keep date as today)
		newComment = '';
	}

	function groupByIsoWeek(sortedByDate: GoldCard[]) {
		const map: Record<string, { week: number; year: number; cards: GoldCard[] }> = {};

		for (const card of sortedByDate) {
			const { week, year } = getISOWeekInfo(card.date);
			const key = `${year}-${String(week).padStart(2, '0')}`;
			if (!map[key]) {
				map[key] = { week, year, cards: [] };
			}
			map[key].cards.push(card);
		}

		// Convert to array and sort descending by year then week
		return Object.values(map).sort((a, b) => {
			if (a.year !== b.year) return b.year - a.year;
			return b.week - a.week;
		});
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		// `undefined` lets Intl pick up the browser's locale automatically
		return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
	}

	/** CSV generation utilities */
	function escapeCsvField(value: string): string {
		if (value.includes('"') || value.includes(',') || value.includes('\n')) {
			return `"${value.replace(/"/g, '""')}"`;
		}
		return value;
	}
	function generateCsv(cards: GoldCard[]): string {
		const header = ['id', 'date', 'comment'].join(',');
		const rows = cards.map((c) =>
			[escapeCsvField(c.id), escapeCsvField(c.date), escapeCsvField(c.comment)].join(',')
		);
		return [header, ...rows].join('\n');
	}

	/** CSV parsing utilities for upload */
	function parseCsvLine(line: string): string[] {
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

	function parseCsv(text: string): GoldCard[] {
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

	function handleCsvUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const parsed = parseCsv(text);
			if (parsed.length) {
				goldcards.current = parsed;
			}
		};
		reader.readAsText(file);
		// Reset the file input so the same file can be uploaded again if needed
		input.value = '';
	}

	const csvContent = $derived(generateCsv(goldcards.current));
	const csvUrl = $derived.by(() => `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
</script>

<Layout>
	<h1>Goldcard Log</h1>

	<p>Logged: {goldcards.current.length}</p>
	<p>To be taken: {goldcardBudget}</p>

	<form onsubmit={addGoldCard}>
		<label>
			Date:
			<input type="date" bind:value={newDate} required />
		</label>
		<label>
			Comment:
			<input type="text" bind:value={newComment} required />
		</label>
		<button type="submit">Log Goldcard</button>
	</form>

	<h2>Log</h2>

	<a
		href={csvUrl}
		download={'goldcards_' + new Date().toISOString().replace(/[:.]/g, '-') + '.csv'}
		target="_blank"
		rel="noopener noreferrer external"
		role="button"
		class="secondary"
	>
		Download as CSV
	</a>
	<label>
		Import CSV (overwrites current log)
		<input type="file" accept=".csv,text/csv" onchange={handleCsvUpload} value="Import" />
	</label>

	{#each byIsoWeek as group (group.week)}
		<h3>Week {String(group.week).padStart(2, '0')}-{String(group.year)}</h3>
		<ul>
			{#each group.cards as card (card.id)}
				<li>
					<strong>{formatDate(card.date)}:</strong>
					{card.comment}
				</li>
			{/each}
		</ul>
	{/each}
</Layout>
