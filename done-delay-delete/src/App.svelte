<script lang="ts">
  import { onMount } from "svelte";
  import {
    createAction,
    deleteAction,
    delayAction,
    markDone,
  } from "./domain/commands";
  import type { ActionEvent } from "./domain/events";
  import { loadEvents, saveEvents } from "./domain/persistence";
  import { landingActions, project } from "./domain/projection";
  import { tallyToday, titleFor } from "./domain/tally";
  import CreateAction from "./components/CreateAction.svelte";
  import EmptyState from "./components/EmptyState.svelte";
  import Landing from "./components/Landing.svelte";

  let events = $state<ActionEvent[]>([]);
  let now = $state(Date.now());

  const model = $derived(project(events, now));
  const landing = $derived(landingActions(model));
  const title = $derived(titleFor(tallyToday(events, now)));

  $effect(() => {
    document.title = title;
  });

  const storage = () =>
    typeof localStorage !== "undefined" ? localStorage : undefined;

  function persist() {
    const s = storage();
    if (s) saveEvents(s, events);
  }

  function create(text: string) {
    const event = createAction(text, Date.now());
    if (!event) return;
    events = [...events, event];
    persist();
  }

  function done(id: string) {
    append(markDone(model, id, Date.now()));
  }

  function delay(id: string) {
    append(delayAction(model, id, Date.now()));
  }

  function remove(id: string) {
    append(deleteAction(model, id, Date.now()));
  }

  function append(event: ActionEvent | null) {
    if (!event) return;
    events = [...events, event];
    persist();
  }

  function focusCreate() {
    document.querySelector<HTMLInputElement>(".create input")?.focus();
  }

  onMount(() => {
    const s = storage();
    events = s ? loadEvents(s) : [];
    const tick = setInterval(() => {
      now = Date.now();
    }, 30_000);
    return () => clearInterval(tick);
  });
</script>

<main class="app">
  <header class="hero">
    <h1>{title}</h1>
  </header>

  {#if landing.length > 0}
    <Landing
      actions={landing}
      onDone={done}
      onDelay={delay}
      onDelete={remove}
    />
  {:else}
    <EmptyState onFirstAction={focusCreate} />
  {/if}

  <CreateAction onCreate={create} />
</main>

<style>
  .app {
    max-width: 44rem;
    margin: 0 auto;
    padding: var(--space-l) var(--space-s);
    display: flex;
    flex-direction: column;
    gap: var(--space-m);
  }

  .hero {
    text-align: center;
    padding: var(--space-l) var(--space-s);
  }

  .hero h1 {
    margin: 0;
    font-size: var(--step-1);
    color: #1a1a1a;
  }

  .hero h1::after {
    content: "";
    display: block;
    width: 100%;
    height: 0.25rem;
    margin: var(--space-xs) auto 0;
    border-radius: 999px;
    background: crimson;
  }
</style>
