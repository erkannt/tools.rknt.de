<script lang="ts">
	import type { BudgetAdjustment } from '../types';

	interface Props {
		loggedCount: number;
		budget: number;
		adjustments?: BudgetAdjustment[];
		onAddAdjustment?: (adjustment: { adjustment: number; comment: string }) => void;
	}

	let { loggedCount, budget, adjustments = [], onAddAdjustment }: Props = $props();

	let newAdjustment: number = $state(0);
	let newComment: string = $state('');

	function handleAddAdjustment(event: SubmitEvent) {
		event.preventDefault();
		if (!newComment.trim()) {
			return;
		}
		onAddAdjustment?.({
			adjustment: newAdjustment,
			comment: newComment.trim()
		});
		newAdjustment = 0;
		newComment = '';
	}
</script>

<div class="budget-wrapper">
	<div class="budget-box">
		<div class="count">{loggedCount}</div>
		<div class="label">Logged</div>
	</div>
	<div class="budget-box">
		<div class="count">{budget}</div>
		<div class="label">To be taken</div>
	</div>
</div>

<details class="budget-adjust">
	<summary>Budget Adjustments ({adjustments.length})</summary>
	<form onsubmit={handleAddAdjustment}>
		<label for="adjustment">Adjustment</label>
		<input id="adjustment" type="number" bind:value={newAdjustment} />

		<label for="adjustment-comment">Comment</label>
		<input id="adjustment-comment" type="text" bind:value={newComment} required />

		<button type="submit" class="btn">Add Adjustment</button>
	</form>
</details>

<style>
	.budget-wrapper {
		display: flex;
		gap: var(--space-l);
	}

	.count {
		font-size: var(--step-3);
	}

	.budget-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-block: var(--space-xs);
		background-color: cornsilk;
		flex-grow: 1;
	}

	.budget-adjust {
		margin-top: var(--space-s);
		border: 1px solid #ccc;
		padding: var(--space-s);
		border-radius: 4px;
	}

	summary {
		cursor: pointer;
		font-weight: bold;
	}

	form {
		display: flex;
		flex-direction: column;
		margin-top: var(--space-s);
	}

	label {
		margin-bottom: var(--space-2xs);
	}

	input {
		padding: var(--space-2xs);
		margin-bottom: var(--space-s);
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
