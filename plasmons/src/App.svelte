<script lang="ts">
  import { parseRoute } from "./lib/route";
  import Create from "./views/Create.svelte";
  import Explore from "./views/Explore.svelte";
  import Fit from "./views/Fit.svelte";

  let hash = $state(location.hash);
  const route = $derived(parseRoute(hash));
</script>

<svelte:window onhashchange={() => (hash = location.hash)} />

<main class="stack">
  <h1>Plasmon Curves</h1>

  {#if route.view === "explore"}
    <Explore />
  {:else if route.view === "create"}
    <Create />
  {:else if route.view === "fit"}
    <Fit simulation={route.simulation} />
  {/if}
</main>

<style>
  main {
    padding: var(--space-m);
  }
</style>
