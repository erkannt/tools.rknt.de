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

	function formatDate(isoDate: string): string {
		const d = new Date(isoDate);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatTime(isoDate: string): string {
		const d = new Date(isoDate);
		return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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

	{#if adjustments.length > 0}
		<ul class="adjustment-list">
			{#each adjustments as adj (adj.id)}
				<li>
					<span class="adj-value">{adj.adjustment >= 0 ? '+' : ''}{adj.adjustment}</span>
					<span class="adj-comment">{adj.comment}</span>
					<span class="adj-date">{formatDate(adj.date)} {formatTime(adj.date)}</span>
				</li>
			{/each}
		</ul>
	{/if}
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

	.adjustment-list {
		list-style: none;
		padding: 0;
		margin-top: var(--space-s);
		font-size: var(--step--1);
	}

	.adjustment-list li {
		display: flex;
		gap: var(--space-xs);
		padding-block: var(--space-2xs);
		border-bottom: 1px solid #eee;
	}

	.adj-value {
		font-weight: bold;
		min-width: 3ch;
	}

	.adj-comment {
		flex-grow: 1;
	}

	.adj-date {
		color: #666;
	}
</style>
