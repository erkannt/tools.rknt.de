<script lang="ts">
	interface GoldCard {
		id: number;
		date: string;
		comment: string;
	}

	let goldcards: GoldCard[] = [
		{ id: 1, date: '2023-01-01', comment: 'First goldcard logged' },
		{ id: 2, date: '2023-02-15', comment: 'Second entry' },
		{ id: 3, date: '2023-03-10', comment: 'Third entry' },
		{ id: 4, date: '2023-04-05', comment: 'Fourth entry' },
		{ id: 5, date: '2023-05-20', comment: 'Fifth entry' }
	];

	// Default date set to today (YYYY‑MM‑DD)
	let newDate: string = new Date().toISOString().split('T')[0];
	let newComment: string = '';

	function addGoldCard() {
		if (!newComment.trim()) {
			return;
		}
		const nextId = goldcards.length ? Math.max(...goldcards.map((c) => c.id)) + 1 : 1;
		goldcards = [
			...goldcards,
			{
				id: nextId,
				date: newDate,
				comment: newComment.trim()
			}
		];
		// Reset comment field (keep date as today)
		newComment = '';
	}
</script>

<h1>Goldcard Log</h1>

<form on:submit|preventDefault={addGoldCard}>
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
<ul>
	{#each goldcards as card (card.id)}
		<li>
			<strong>{card.date}</strong>: {card.comment}
		</li>
	{/each}
</ul>
