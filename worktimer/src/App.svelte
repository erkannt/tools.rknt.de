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

  function timeOfDay(ms: number): string {
    const d = new Date(ms)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  function hhmm(ms: number): string {
    const minutes = Math.max(0, Math.floor(ms / 60_000))
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mm = String(minutes % 60).padStart(2, '0')
    return `${hh}:${mm}`
  }

  function iso(ms: number): string {
    return new Date(ms).toISOString()
  }

  const newestFirst = $derived([...sessions].reverse())

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

<ul>
  {#each newestFirst as session (session.startId)}
    <li>
      <time datetime={iso(session.startedAt)}>{timeOfDay(session.startedAt)}</time>
      {#if session.stoppedAt !== null}
        – <time datetime={iso(session.stoppedAt)}>{timeOfDay(session.stoppedAt)}</time>
        (<span data-testid="session-length">{hhmm(session.stoppedAt - session.startedAt)}</span>)
      {/if}
    </li>
  {/each}
</ul>
