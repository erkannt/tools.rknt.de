<script lang="ts">
	interface GoldCard {
		id: string;
		date: string;
		comment: string;
	}

	let goldcards: GoldCard[] = [
		{
			id: '1a2b3c4d-0000-0000-0000-000000000001',
			date: '2023-01-01',
			comment: 'First goldcard logged'
		},
		{ id: '1a2b3c4d-0000-0000-0000-000000000002', date: '2023-02-15', comment: 'Second entry' },
		{ id: '1a2b3c4d-0000-0000-0000-000000000003', date: '2023-03-10', comment: 'Third entry' },
		{ id: '1a2b3c4d-0000-0000-0000-000000000004', date: '2023-04-05', comment: 'Fourth entry' },
		{ id: '1a2b3c4d-0000-0000-0000-000000000005', date: '2023-05-20', comment: 'Fifth entry' }
	];

	// Default date set to today (YYYY‑MM‑DD)
	let newDate: string = new Date().toISOString().split('T')[0];
	let newComment: string = '';

	function addGoldCard() {
		if (!newComment.trim()) {
			return;
		}
		const newId = crypto.randomUUID();
		goldcards.push({
			id: newId,
			date: newDate,
			comment: newComment.trim()
		});
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
