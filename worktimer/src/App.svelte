<script lang="ts">
  import {
    appendEvent,
    loadEvents,
    parseEventsJson,
    removeEvents,
    replaceEvents,
    updateEventAt,
    type WorkEvent,
  } from './events'
  import { deriveSessions, elapsedToday, elapsedOnDay, validateEdit, type Session } from './sessions'
  import { generateSampleEvents } from './seed'
  import { parseHHMM, formatHHMM } from './time'
  import { activeTargets, dailyTarget, flexBudget, weekStartLocal, weeklyTarget } from './targets'
  import { WEEKDAYS } from './events'

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
  const todayTargetMin = $derived(dailyTarget(events, startOfDayMs(now)))
  const todayDeltaMs = $derived(
    todayTargetMin === null ? null : elapsedMs - todayTargetMin * 60_000,
  )
  const todaySessions = $derived(
    [...sessions]
      .filter(s => startOfDayMs(s.startedAt) === startOfDayMs(now))
      .reverse(),
  )

  const DAY = 24 * 3600_000
  const thisWeekStart = $derived(weekStartLocal(now))

  type DayBlock = { dayStart: number; sessions: Session[]; total: number; delta: number | null }

  const pastDaysThisWeek = $derived.by<DayBlock[]>(() => {
    const todayStart = startOfDayMs(now)
    const days: DayBlock[] = []
    for (let d = thisWeekStart; d < todayStart; d += DAY) {
      const daySessions = [...sessions]
        .filter(s => startOfDayMs(s.startedAt) === d)
        .reverse()
      const total = elapsedOnDay(sessions, d, now)
      const tgt = dailyTarget(events, d)
      const delta = tgt === null ? null : total - tgt * 60_000
      days.push({ dayStart: d, sessions: daySessions, total, delta })
    }
    return days.reverse()
  })

  const weekTotalMs = $derived.by(() => {
    let sum = 0
    const todayStart = startOfDayMs(now)
    for (let d = thisWeekStart; d <= todayStart; d += DAY) {
      sum += elapsedOnDay(sessions, d, now)
    }
    return sum
  })

  const weekTargetInfo = $derived(weeklyTarget(events, thisWeekStart))
  const weekDeltaMs = $derived(
    weekTargetInfo.hasAny ? weekTotalMs - weekTargetInfo.mins * 60_000 : null,
  )

  function dayLabel(ms: number): string {
    const d = new Date(ms)
    const wd = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()]
    return `${wd} ${d.getDate()}`
  }

  function weekLabel(ms: number): string {
    const d = new Date(ms)
    const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
    return `Wk of ${d.getDate()} ${month}`
  }

  type WeekBlock = { weekStart: number; sessions: Session[]; total: number; delta: number | null }

  const previousWeeks = $derived.by<WeekBlock[]>(() => {
    const buckets = new Map<number, Session[]>()
    for (const s of sessions) {
      const ws = weekStartLocal(s.startedAt)
      if (ws >= thisWeekStart) continue
      const arr = buckets.get(ws) ?? []
      arr.push(s)
      buckets.set(ws, arr)
    }
    const blocks: WeekBlock[] = []
    for (const [ws, arr] of buckets) {
      let total = 0
      for (let i = 0; i < 7; i++) total += elapsedOnDay(sessions, ws + i * DAY, now)
      const wt = weeklyTarget(events, ws)
      const delta = wt.hasAny ? total - wt.mins * 60_000 : null
      blocks.push({
        weekStart: ws,
        sessions: [...arr].sort((a, b) => b.startedAt - a.startedAt),
        total,
        delta,
      })
    }
    return blocks.sort((a, b) => b.weekStart - a.weekStart)
  })
  const budgetMs = $derived(flexBudget(events, now))

  const today = $derived(activeTargets(events, startOfDayMs(now)))
  let targetInputs = $state<Record<string, string>>({ Mo: '', Tu: '', We: '', Th: '', Fr: '' })
  let effectiveFromInput = $state('')
  let targetsError = $state<string | null>(null)

  function startOfDayMs(t: number): number {
    const d = new Date(t)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  function toDateInput(ms: number): string {
    const d = new Date(ms)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  function fromDateInput(s: string): number {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
  }

  function targetsToInputs(t: { Mo: number; Tu: number; We: number; Th: number; Fr: number } | null) {
    const minToHHMM = (m: number) => {
      const hh = String(Math.floor(m / 60)).padStart(2, '0')
      const mm = String(m % 60).padStart(2, '0')
      return `${hh}${mm}`
    }
    return {
      Mo: t === null ? '' : minToHHMM(t.Mo),
      Tu: t === null ? '' : minToHHMM(t.Tu),
      We: t === null ? '' : minToHHMM(t.We),
      Th: t === null ? '' : minToHHMM(t.Th),
      Fr: t === null ? '' : minToHHMM(t.Fr),
    }
  }

  $effect(() => {
    targetInputs = targetsToInputs(today)
    if (effectiveFromInput === '') effectiveFromInput = toDateInput(Date.now())
  })

  function formatBudget(ms: number): string {
    const sign = ms < 0 ? '-' : '+'
    const total = Math.floor(Math.abs(ms) / 60_000)
    const hh = String(Math.floor(total / 60)).padStart(2, '0')
    const mm = String(total % 60).padStart(2, '0')
    return `${sign}${hh}:${mm}`
  }

  function saveTargets() {
    const parsed: Record<string, number> = {}
    for (const day of WEEKDAYS) {
      const s = targetInputs[day]
      if (!/^\d{4}$/.test(s)) { targetsError = 'Use HHMM (e.g. 0800).'; return }
      const hh = Number(s.slice(0, 2))
      const mm = Number(s.slice(2, 4))
      if (hh > 23 || mm > 59) { targetsError = 'Use HHMM (e.g. 0800).'; return }
      parsed[day] = hh * 60 + mm
    }
    const eff = fromDateInput(effectiveFromInput)
    if (Number.isNaN(eff)) { targetsError = 'Invalid date.'; return }
    events = [
      ...events,
      appendEvent({
        type: 'WorkTargetsSet',
        at: Date.now(),
        effectiveFrom: eff,
        targets: parsed as { Mo: number; Tu: number; We: number; Th: number; Fr: number },
      }),
    ]
    targetsError = null
  }

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

  function deleteSession(session: { startId: string; stopId: string | null }) {
    const ids = session.stopId === null ? [session.startId] : [session.startId, session.stopId]
    removeEvents(ids)
    events = loadEvents()
    if (editingId === session.startId) {
      editingId = null
      editError = null
    }
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

<details>
  <summary>Flex time</summary>
  <fieldset>
    <legend>Weekly targets</legend>
    <label>
      Effective from
      <input type="date" bind:value={effectiveFromInput} />
    </label>
    {#each WEEKDAYS as day}
      <label>
        {day}
        <input
          type="text"
          inputmode="numeric"
          maxlength="4"
          size="4"
          pattern="\d{'{4}'}"
          bind:value={targetInputs[day]}
        />
      </label>
    {/each}
    <button onclick={saveTargets}>Save targets</button>
    {#if targetsError !== null}
      <p role="alert">{targetsError}</p>
    {/if}
  </fieldset>
</details>

<p>Flex budget: <span data-testid="flex-budget">{formatBudget(budgetMs)}</span></p>

<footer>
  <button onclick={loadSample}>Load sample data</button>
  <label>
    Import JSON
    <input type="file" accept="application/json" onchange={importJson} />
  </label>
  <button onclick={exportJson}>Export JSON</button>
</footer>

{#snippet sessionRow(session: Session)}
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
      <button onclick={() => deleteSession(session)}>Delete</button>
    {/if}
  </li>
{/snippet}

<section>
  <h2>Today</h2>
  <p>
    <time data-testid="elapsed-today">{format(elapsedMs)}</time>
    {#if todayDeltaMs !== null}
      <span data-testid="today-delta">{formatBudget(todayDeltaMs)}</span>
    {/if}
  </p>
  <ul>
    {#each todaySessions as session (session.startId)}
      {@render sessionRow(session)}
    {/each}
  </ul>
</section>

<section>
  <h2>This week</h2>
  <p>
    <span data-testid="week-total">{hhmm(weekTotalMs)}</span>
    {#if weekDeltaMs !== null}
      <span data-testid="week-delta">{formatBudget(weekDeltaMs)}</span>
    {/if}
  </p>
  {#each pastDaysThisWeek as day (day.dayStart)}
    <details data-day-start={day.dayStart}>
      <summary>
        {dayLabel(day.dayStart)}
        <span>{hhmm(day.total)}</span>
        {#if day.delta !== null}
          <span>{formatBudget(day.delta)}</span>
        {/if}
      </summary>
      <ul>
        {#each day.sessions as session (session.startId)}
          {@render sessionRow(session)}
        {/each}
      </ul>
    </details>
  {/each}
</section>

<section>
  <h2>Previous weeks</h2>
  {#each previousWeeks as week (week.weekStart)}
    <details data-week-start={week.weekStart}>
      <summary>
        {weekLabel(week.weekStart)}
        <span>{hhmm(week.total)}</span>
        {#if week.delta !== null}
          <span>{formatBudget(week.delta)}</span>
        {/if}
      </summary>
      <ul>
        {#each week.sessions as session (session.startId)}
          {@render sessionRow(session)}
        {/each}
      </ul>
    </details>
  {/each}
</section>
