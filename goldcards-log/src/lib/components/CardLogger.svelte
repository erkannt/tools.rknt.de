<script lang="ts">
	interface Props {
		onAddCard: (card: { date: string; comment: string }) => void;
		defaultDate?: string;
	}

	let { onAddCard, defaultDate }: Props = $props();

	const getDefaultDate = () => defaultDate ?? new Date().toISOString().split('T')[0];
	let newDate: string = $state(getDefaultDate());
	let newComment: string = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!newComment.trim()) {
			return;
		}
		onAddCard({
			date: newDate,
			comment: newComment.trim()
		});
		// Reset comment field (keep date as today)
		newComment = '';
	}
</script>

<form onsubmit={handleSubmit}>
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
