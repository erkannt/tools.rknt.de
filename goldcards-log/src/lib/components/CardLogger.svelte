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
	<label for="date">Date</label>
	<input id="date" type="date" bind:value={newDate} required />

	<label for="comment">Comment</label>
	<input id="comment" type="text" bind:value={newComment} required />

	<button type="submit" class="btn">Log Goldcard</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
	}

	label {
		margin-bottom: var(--space-2xs);
	}

	input {
		padding: var(--space-2xs);
		margin-bottom: var(--space-s);
	}

	button {
		margin-top: var(--space-s);
		grid-column: 1 / -1;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xs) var(--space-s);
		line-height: 1;
		font-size: var(--step-1);
		background-color: oklch(from lightslategrey calc(l * 1.3) c h);
		border-radius: 4px;
		border: none;
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		user-select: none;
	}

	.btn:hover,
	.btn:focus-visible {
		outline: 2px solid lightslategrey;
		outline-offset: 2px;
	}
</style>
