<script lang="ts">
  import { appendEvent, loadEvents, type WorkEvent } from './events'
  import { deriveSessions, elapsedToday } from './sessions'

  let events = $state<WorkEvent[]>(loadEvents())
  let now = $state(Date.now())
  const sessions = $derived(deriveSessions(events))
  const running = $derived(events.at(-1)?.type === 'WorkStarted')
  const elapsedMs = $derived(elapsedToday(sessions, now))

  $effect(() => {
    const id = setInterval(() => { now = Date.now() }, 1000)
    return () => clearInterval(id)
  })

  function format(ms: number): string {
    const s = Math.floor(ms / 1000)
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

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

<p>Today: <time data-testid="elapsed-today">{format(elapsedMs)}</time></p>
