<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Goldcard Log</title>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.amber.min.css"
	/>
</svelte:head>

<main class="container">
	{@render children()}
</main>

<style>
	main {
		margin-top: 6rem;
	}
</style>
