<script lang="ts">
  import {
    appendEvent,
    loadEvents,
    parseEventsJson,
    replaceEvents,
    updateEventAt,
    type WorkEvent,
  } from './events'
  import { deriveSessions, elapsedToday, validateEdit } from './sessions'
  import { generateSampleEvents } from './seed'
  import { parseHHMM, formatHHMM } from './time'

  let events = $state<WorkEvent[]>(loadEvents())
  let now = $state(Date.now())
  let editingId = $state<string | null>(null)
  let editStart = $state('')
  let editStop = $state('')
  let editStartAnchor = $state(0)
  let editStopAnchor = $state(0)
  let editError = $state<string | null>(null)

  const sessions = $derived(deriveSessions(events))
  const running = $derived(events.at(-1)?.type === 'WorkStarted')
  const elapsedMs = $derived(elapsedToday(sessions, now))
  const newestFirst = $derived([...sessions].reverse())

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

  function startEdit(startId: string, startedAt: number, stoppedAt: number | null) {
    editingId = startId
    editStart = formatHHMM(startedAt)
    editStop = stoppedAt === null ? '' : formatHHMM(stoppedAt)
    editStartAnchor = startedAt
    editStopAnchor = stoppedAt ?? 0
    editError = null
  }

  function cancelEdit() {
    editingId = null
    editError = null
  }

  function saveEdit(session: { startId: string; stopId: string | null }) {
    const start = parseHHMM(editStart, editStartAnchor)
    const stop = session.stopId === null ? null : parseHHMM(editStop, editStopAnchor)
    if (start === null || (session.stopId !== null && stop === null)) {
      editError = 'Use HHMM (e.g. 0930).'
      return
    }
    const result = validateEdit({ startId: session.startId, start, stop }, sessions, Date.now())
    if (!result.ok) {
      editError = result.reason
      return
    }
    updateEventAt(session.startId, start)
    if (session.stopId !== null && stop !== null) updateEventAt(session.stopId, stop)
    events = loadEvents()
    editingId = null
    editError = null
  }

  function editedLength(startedAt: number, stoppedAt: number): number {
    const s = parseHHMM(editStart, editStartAnchor)
    const e = parseHHMM(editStop, editStopAnchor)
    if (s === null || e === null) return stoppedAt - startedAt
    return e - s
  }

  function start() {
    events = [...events, appendEvent({ type: 'WorkStarted', at: Date.now() })]
  }

  function stop() {
    events = [...events, appendEvent({ type: 'WorkStopped', at: Date.now() })]
  }

  function loadSample() {
    const next = generateSampleEvents({ today: Date.now(), days: 90, seed: Date.now() })
    replaceEvents(next)
    events = next
  }

  async function importJson(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    const next = parseEventsJson(text)
    replaceEvents(next)
    events = next
    input.value = ''
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'worktimer-events.json'
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

<h1>worktimer</h1>

{#if running}
  <button onclick={stop}>Stop</button>
{:else}
  <button onclick={start}>Start</button>
{/if}

<p>Today: <time data-testid="elapsed-today">{format(elapsedMs)}</time></p>

<footer>
  <button onclick={loadSample}>Load sample data</button>
  <label>
    Import JSON
    <input type="file" accept="application/json" onchange={importJson} />
  </label>
  <button onclick={exportJson}>Export JSON</button>
</footer>

<ul>
  {#each newestFirst as session (session.startId)}
    <li>
      {#if editingId === session.startId}
        <label>
          Start
          <input type="text" inputmode="numeric" pattern="\d{'{4}'}" maxlength="4" size="4" bind:value={editStart} />
        </label>
        {#if session.stoppedAt !== null}
          <label>
            Stop
            <input type="text" inputmode="numeric" pattern="\d{'{4}'}" maxlength="4" size="4" bind:value={editStop} />
          </label>
          (<span data-testid="session-length">{hhmm(editedLength(session.startedAt, session.stoppedAt))}</span>)
        {/if}
        <button onclick={() => saveEdit(session)}>Save</button>
        <button onclick={cancelEdit}>Cancel</button>
        {#if editError !== null}
          <p role="alert">{editError}</p>
        {/if}
      {:else}
        <time datetime={iso(session.startedAt)}>{timeOfDay(session.startedAt)}</time>
        {#if session.stoppedAt !== null}
          – <time datetime={iso(session.stoppedAt)}>{timeOfDay(session.stoppedAt)}</time>
          (<span data-testid="session-length">{hhmm(session.stoppedAt - session.startedAt)}</span>)
        {/if}
        <button onclick={() => startEdit(session.startId, session.startedAt, session.stoppedAt)}>Edit</button>
      {/if}
    </li>
  {/each}
</ul>
