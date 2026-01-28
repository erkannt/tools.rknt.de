<script lang="ts">
	import { LocalStorage } from './lib/localStorage.svelte';
	import type { GoldCard } from './lib/types';
	import { generateCsv, parseCsv } from './lib/csv';
	import { calculateBudget } from './lib/budget';
	import { groupByIsoWeek } from './lib/weekGrouping';
	import { formatDate } from './lib/dateUtils';

	const goldcards = new LocalStorage<GoldCard[]>('goldcards', []);
	const sortedByDate: GoldCard[] = $derived(
		[...goldcards.current].sort((a, b) => b.date.localeCompare(a.date))
	);
	const byIsoWeek = $derived(groupByIsoWeek(sortedByDate));

	const goldcardBudget = $derived(calculateBudget(goldcards.current));

	let newDate: string = $state(new Date().toISOString().split('T')[0]);
	let newComment: string = $state('');

	function addGoldCard(event: SubmitEvent) {
		event.preventDefault();
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

<main class="container">
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
</main>

<style>
	main {
		margin-top: 6rem;
	}
</style>
