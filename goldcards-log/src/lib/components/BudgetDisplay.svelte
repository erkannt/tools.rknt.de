<script lang="ts">
	interface Props {
		loggedCount: number;
		budget: number;
	}

	let { loggedCount, budget }: Props = $props();
</script>

<p>Logged: {loggedCount}</p>
<p>To be taken: {budget}</p>
