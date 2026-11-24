<script lang="ts">
  import { parseRoute } from "./lib/route";
  import Explore from "./views/Explore.svelte";

  let hash = $state(location.hash);
  const route = $derived(parseRoute(hash));
</script>

<svelte:window onhashchange={() => (hash = location.hash)} />

<main class="stack">
  <h1>Plasmon Curves</h1>

  {#if route.view === "explore"}
    <Explore />
  {/if}
</main>

<style>
  main {
    padding: var(--space-m);
  }
</style>
