<script lang="ts">
  import type { Action } from "../domain/projection";
  import ActionCard from "./ActionCard.svelte";

  let {
    actions,
    onDone,
    onDelay,
    onDelete,
  }: {
    actions: Action[];
    onDone: (id: string) => void;
    onDelay: (id: string) => void;
    onDelete: (id: string) => void;
  } = $props();
</script>

<ul class="landing">
  {#each actions as action (action.id)}
    <ActionCard
      {action}
      {onDone}
      {onDelay}
      {onDelete}
    />
  {/each}
</ul>

<style>
  .landing {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>