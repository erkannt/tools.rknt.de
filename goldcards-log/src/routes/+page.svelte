<script>
	const goldcards = [
		{ id: 1, date: '2023-01-01', comment: 'First goldcard logged' },
		{ id: 2, date: '2023-02-15', comment: 'Second entry' },
		{ id: 3, date: '2023-03-10', comment: 'Third entry' },
		{ id: 4, date: '2023-04-05', comment: 'Fourth entry' },
		{ id: 5, date: '2023-05-20', comment: 'Fifth entry' }
	];
</script>

<h1>Goldcard Log</h1>
<ul>
	{#each goldcards as card (card.id)}
		<li>
			<strong>{card.date}</strong>: {card.comment}
		</li>
	{/each}
</ul>
