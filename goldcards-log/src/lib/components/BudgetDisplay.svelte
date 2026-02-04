<script lang="ts">
	interface Props {
		loggedCount: number;
		budget: number;
	}

	let { loggedCount, budget }: Props = $props();
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
</style>
