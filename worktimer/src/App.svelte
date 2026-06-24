<script lang="ts">
  import { appendEvent, loadEvents, type WorkEvent } from './events'

  let events = $state<WorkEvent[]>(loadEvents())
  const running = $derived(events.at(-1)?.type === 'WorkStarted')

  function start() {
    events = [...events, appendEvent({ type: 'WorkStarted', at: Date.now() })]
  }

  function stop() {
    events = [...events, appendEvent({ type: 'WorkStopped', at: Date.now() })]
  }
</script>

<h1>worktimer</h1>

{#if running}
  <button onclick={stop}>Stop</button>
{:else}
  <button onclick={start}>Start</button>
{/if}
