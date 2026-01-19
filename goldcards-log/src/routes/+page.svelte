<script lang="ts">
	import { getISOWeekInfo } from '$lib/isoweek';
	import { LocalStorage } from '$lib/localStorage.svelte';

	interface GoldCard {
		id: string;
		date: string;
		comment: string;
	}

	const goldcards = new LocalStorage<GoldCard[]>('goldcards', [
		{
			id: '1a2b3c4d-0000-0000-0000-000000000001',
			date: '2023-01-01',
			comment: 'First goldcard logged'
		},
		{ id: '1a2b3c4d-0000-0000-0000-000000000002', date: '2023-02-15', comment: 'Second entry' },
		{ id: '1a2b3c4d-0000-0000-0000-000000000003', date: '2023-03-10', comment: 'Third entry' },
		{ id: '1a2b3c4d-0000-0000-0000-000000000004', date: '2023-04-05', comment: 'Fourth entry' },
		{ id: '1a2b3c4d-0000-0000-0000-000000000005', date: '2023-05-20', comment: 'Fifth entry' }
	]);
	const sortedByDate = $derived(
		[...goldcards.current].sort((a, b) => b.date.localeCompare(a.date))
	);
	const byIsoWeek = $derived(groupByIsoWeek(sortedByDate));

	const goldcardBudget = new LocalStorage('budget', 5);

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
		// Decrement budget (allow negative values)
		goldcardBudget.current -= 1;
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
</script>

<h1>Goldcard Log</h1>

<p>To be taken: {goldcardBudget.current}</p>

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

{#each byIsoWeek as group (group.week)}
	<h3>Week {String(group.week).padStart(2, '0')}-{String(group.year)}</h3>
	<ul>
		{#each group.cards as card (card.id)}
			<li>
				<strong>{card.date}</strong>: {card.comment}
			</li>
		{/each}
	</ul>
{/each}
