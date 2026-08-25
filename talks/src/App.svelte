<script lang="ts">
  import Landing from "./Landing.svelte";
  import Presenter from "./Presenter.svelte";

  const params = new URLSearchParams(window.location.search);
  const presentFile = params.get("present");
</script>

{#if presentFile}
  <Presenter file={presentFile} />
{:else}
  <Landing />
{/if}
