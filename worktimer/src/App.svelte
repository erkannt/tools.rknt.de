<script lang="ts">
  import {
    addSession,
    appendEvent,
    loadEvents,
    parseEventsJson,
    removeEvents,
    replaceEvents,
    updateEventAt,
    type WorkEvent,
  } from "./events";
  import { deriveSessions, validateEdit, type Session } from "./sessions";
  import { generateSampleEvents } from "./seed";
  import {
    parseHHMM,
    formatHHMM,
    startOfDay as startOfDayMs,
    nextDay,
    isoWeekLabel,
  } from "./time";
  import {
    activeTargets,
    activeTargetEvent,
    dailyTarget,
    hasOverride,
    weekStartLocal,
    weeklyTarget,
  } from "./targets";
  import { WEEKDAYS } from "./events";

  let events = $state<WorkEvent[]>(loadEvents());
  let now = $state(Date.now());
  let editingId = $state<string | null>(null);
  let editStart = $state("");
  let editStop = $state("");
  let editStartAnchor = $state(0);
  let editStopAnchor = $state(0);
  let editError = $state<string | null>(null);

  const sessions = $derived(deriveSessions(events));
  const running = $derived(events.at(-1)?.type === "WorkStarted");
  const today = $derived(startOfDayMs(now));
  const thisWeekStart = $derived(weekStartLocal(today));

  // Per-day worked time from completed sessions and from running-session
  // chunks on days strictly before today. Recomputes on events change or
  // midnight rollover, not on each 1Hz tick.
  const workedPerDay = $derived.by(() => {
    const m = new Map<number, number>();
    for (const s of sessions) {
      const end = s.stoppedAt ?? today;
      let d = startOfDayMs(s.startedAt);
      while (d < end) {
        const dayEnd = nextDay(d);
        const overlap = Math.min(end, dayEnd) - Math.max(s.startedAt, d);
        if (overlap > 0) m.set(d, (m.get(d) ?? 0) + overlap);
        d = dayEnd;
      }
    }
    return m;
  });

  // Sessions grouped by start day, newest-first within each day.
  const sessionsByDay = $derived.by(() => {
    const m = new Map<number, Session[]>();
    for (const s of sessions) {
      const d = startOfDayMs(s.startedAt);
      const arr = m.get(d) ?? [];
      arr.push(s);
      m.set(d, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => b.startedAt - a.startedAt);
    return m;
  });

  const runningSession = $derived(
    sessions.find((s) => s.stoppedAt === null) ?? null,
  );

  const elapsedMs = $derived.by(() => {
    let total = workedPerDay.get(today) ?? 0;
    const tomorrow = nextDay(today);
    if (runningSession !== null && runningSession.startedAt < tomorrow) {
      const tipStart = Math.max(runningSession.startedAt, today);
      const overlap = Math.min(now, tomorrow) - tipStart;
      if (overlap > 0) total += overlap;
    }
    return total;
  });

  const todayTargetMin = $derived(dailyTarget(events, today));
  const todayDeltaMs = $derived(
    todayTargetMin === null ? null : elapsedMs - todayTargetMin * 60_000,
  );
  const todaySessions = $derived(sessionsByDay.get(today) ?? []);

  type DayBlock = {
    dayStart: number;
    sessions: Session[];
    total: number;
    delta: number | null;
  };

  // Static across the 1Hz tick: only depends on workedPerDay, sessionsByDay,
  // events (for targets) and thisWeekStart/today (which only change at midnight).
  const pastDaysThisWeek = $derived.by<DayBlock[]>(() => {
    const days: DayBlock[] = [];
    for (let d = thisWeekStart; d < today; d = nextDay(d)) {
      const total = workedPerDay.get(d) ?? 0;
      const tgt = dailyTarget(events, d);
      const delta = tgt === null ? null : total - tgt * 60_000;
      days.push({
        dayStart: d,
        sessions: sessionsByDay.get(d) ?? [],
        total,
        delta,
      });
    }
    return days.reverse();
  });

  const weekPastDaysTotal = $derived.by(() => {
    let sum = 0;
    for (let d = thisWeekStart; d < today; d = nextDay(d)) {
      sum += workedPerDay.get(d) ?? 0;
    }
    return sum;
  });
  const weekTotalMs = $derived(weekPastDaysTotal + elapsedMs);

  const weekTargetInfo = $derived(weeklyTarget(events, thisWeekStart));
  const weekDeltaMs = $derived(
    weekTargetInfo.hasAny ? weekTotalMs - weekTargetInfo.mins * 60_000 : null,
  );

  function dayLabel(ms: number): string {
    const d = new Date(ms);
    const wd = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
    return `${wd} ${d.getDate()}`;
  }

  type DayItem = {
    text: string;
    bg: string | null;
    fg: string;
    isMonth: boolean;
  };
  type WeekBlock = {
    weekStart: number;
    sessions: Session[];
    total: number;
    delta: number | null;
    dayItems: DayItem[];
  };

  // Two-letter, unique abbreviations so a month-transition week keeps the
  // same column width as a regular two-digit day number.
  const MONTHS = [
    "Ja",
    "Fe",
    "Mr",
    "Ap",
    "My",
    "Jn",
    "Jl",
    "Au",
    "Se",
    "Oc",
    "No",
    "De",
  ];

  function dayItemFor(day: number): DayItem {
    const date = new Date(day);
    const dom = date.getDate();
    const isMonth = dom === 1;
    const text = isMonth
      ? MONTHS[date.getMonth()]
      : String(dom).padStart(2, "0");
    let bg: string | null = null;
    let fg = "#222";
    if (hasOverride(events, day)) {
      bg = "cornflowerblue";
      fg = "#222";
    } else {
      const tgt = dailyTarget(events, day);
      if (tgt !== null) {
        const delta = (workedPerDay.get(day) ?? 0) - tgt * 60_000;
        if (delta > 0) {
          bg = "teal";
          fg = "white";
        } else if (delta < 0) {
          bg = "crimson";
          fg = "white";
        }
      }
    }
    return { text, bg, fg, isMonth };
  }

  const previousWeeks = $derived.by<WeekBlock[]>(() => {
    const buckets = new Map<number, Session[]>();
    for (const s of sessions) {
      const ws = weekStartLocal(s.startedAt);
      if (ws >= thisWeekStart) continue;
      const arr = buckets.get(ws) ?? [];
      arr.push(s);
      buckets.set(ws, arr);
    }
    const blocks: WeekBlock[] = [];
    for (const [ws, arr] of buckets) {
      let total = 0;
      const dayItems: DayItem[] = [];
      let day = ws;
      for (let i = 0; i < 7; i++) {
        total += workedPerDay.get(day) ?? 0;
        if (i < 5) dayItems.push(dayItemFor(day)); // Mo-Fr
        day = nextDay(day);
      }
      const wt = weeklyTarget(events, ws);
      const delta = wt.hasAny ? total - wt.mins * 60_000 : null;
      blocks.push({
        weekStart: ws,
        sessions: [...arr].sort((a, b) => b.startedAt - a.startedAt),
        total,
        delta,
        dayItems,
      });
    }
    return blocks.sort((a, b) => b.weekStart - a.weekStart);
  });

  function formatHm(ms: number): string {
    const m = Math.max(0, Math.floor(ms / 60_000));
    return `${String(Math.floor(m / 60)).padStart(2, "0")}h${String(m % 60).padStart(2, "0")}m`;
  }

  function isoWeekNumber(ms: number): string {
    return isoWeekLabel(ms).slice(5); // 'W##'
  }

  // Budget split into static-past and live-today parts so the per-second
  // tick only re-derives the today contribution.
  const flexAdjustmentsTotal = $derived.by(() => {
    let total = 0;
    for (const ev of events)
      if (ev.type === "FlexAdjusted") total += ev.deltaMs;
    return total;
  });
  const budgetEarliestDay = $derived.by(() => {
    let earliest = Infinity;
    for (const ev of events) {
      if (ev.type === "WorkTargetsSet" && ev.effectiveFrom < earliest)
        earliest = ev.effectiveFrom;
      if (ev.type === "TargetOverride" && ev.startDay < earliest)
        earliest = ev.startDay;
    }
    return earliest === Infinity ? null : startOfDayMs(earliest);
  });
  const budgetPast = $derived.by(() => {
    let total = flexAdjustmentsTotal;
    if (budgetEarliestDay === null) return total;
    for (let d = budgetEarliestDay; d < today; d = nextDay(d)) {
      const tgt = dailyTarget(events, d);
      if (tgt === null) continue;
      const worked = workedPerDay.get(d) ?? 0;
      total += worked - tgt * 60_000;
    }
    return total;
  });
  const budgetMs = $derived.by(() => {
    let total = budgetPast;
    if (todayTargetMin !== null) total += elapsedMs - todayTargetMin * 60_000;
    return total;
  });

  const CHART_WEEKS = 24;
  type WeekPoint = { weekStart: number; delta: number; cumulative: number };
  const weeklyBudgetSeries = $derived.by<WeekPoint[]>(() => {
    // Window: CHART_WEEKS completed weeks ending with the week *before* this
    // week (so the in-progress current week is excluded).
    let firstWs = thisWeekStart;
    for (let i = 0; i < CHART_WEEKS; i++) {
      const d = new Date(firstWs);
      d.setDate(d.getDate() - 7);
      firstWs = d.getTime();
    }
    // Pre-window cumulative: per-day deltas + adjustments before firstWs.
    let cumulative = 0;
    for (const ev of events) {
      if (ev.type === "FlexAdjusted" && ev.at < firstWs)
        cumulative += ev.deltaMs;
    }
    if (budgetEarliestDay !== null) {
      for (let day = budgetEarliestDay; day < firstWs; day = nextDay(day)) {
        const tgt = dailyTarget(events, day);
        if (tgt === null) continue;
        const worked = workedPerDay.get(day) ?? 0;
        cumulative += worked - tgt * 60_000;
      }
    }
    const points: WeekPoint[] = [];
    let ws = firstWs;
    for (let i = 0; i < CHART_WEEKS; i++) {
      const weekEnd = (() => {
        const d = new Date(ws);
        d.setDate(d.getDate() + 7);
        return d.getTime();
      })();
      let weekDelta = 0;
      let day = ws;
      for (let j = 0; j < 7; j++) {
        const tgt = dailyTarget(events, day);
        if (tgt !== null) {
          const worked = workedPerDay.get(day) ?? 0;
          weekDelta += worked - tgt * 60_000;
        }
        day = nextDay(day);
      }
      for (const ev of events) {
        if (ev.type === "FlexAdjusted" && ev.at >= ws && ev.at < weekEnd)
          weekDelta += ev.deltaMs;
      }
      cumulative += weekDelta;
      points.push({ weekStart: ws, delta: weekDelta, cumulative });
      ws = weekEnd;
    }
    return points;
  });

  const chartGeom = $derived.by(() => {
    const W = 600,
      H = 200,
      PL = 50,
      PR = 10,
      PT = 10,
      PB = 24;
    const plotW = W - PL - PR;
    const plotH = H - PT - PB;
    let yMin = 0,
      yMax = 0;
    for (const p of weeklyBudgetSeries) {
      if (p.delta < yMin) yMin = p.delta;
      if (p.delta > yMax) yMax = p.delta;
      if (p.cumulative < yMin) yMin = p.cumulative;
      if (p.cumulative > yMax) yMax = p.cumulative;
    }
    if (yMin === yMax) yMax = yMin + 1;
    const pad = Math.max(1, (yMax - yMin) * 0.05);
    yMin -= pad;
    yMax += pad;
    const range = yMax - yMin;
    const yToPx = (y: number) => PT + plotH - ((y - yMin) / range) * plotH;
    const step = plotW / Math.max(1, weeklyBudgetSeries.length);
    const barW = step * 0.7;
    return {
      W,
      H,
      PL,
      PR,
      PT,
      PB,
      plotW,
      plotH,
      yMin,
      yMax,
      yToPx,
      step,
      barW,
      zeroY: yToPx(0),
    };
  });
  const chartBars = $derived(
    weeklyBudgetSeries.map((p, i) => {
      const x =
        chartGeom.PL +
        i * chartGeom.step +
        (chartGeom.step - chartGeom.barW) / 2;
      const top = chartGeom.yToPx(Math.max(p.delta, 0));
      const bot = chartGeom.yToPx(Math.min(p.delta, 0));
      return {
        x,
        y: top,
        width: chartGeom.barW,
        height: Math.max(0, bot - top),
        point: p,
      };
    }),
  );
  const chartLinePoints = $derived(
    weeklyBudgetSeries
      .map(
        (p, i) =>
          `${chartGeom.PL + i * chartGeom.step + chartGeom.step / 2},${chartGeom.yToPx(p.cumulative)}`,
      )
      .join(" "),
  );
  const chartGridlines = $derived.by(() => {
    const step = 5 * 3600_000;
    const first = Math.ceil(chartGeom.yMin / step) * step;
    const last = Math.floor(chartGeom.yMax / step) * step;
    const out: number[] = [];
    for (let v = first; v <= last; v += step) out.push(v);
    return out;
  });

  type OutlierDay = {
    day: number;
    worked: number;
    targetMs: number;
    delta: number;
  };
  const outlierDays = $derived.by<OutlierDay[]>(() => {
    if (budgetEarliestDay === null) return [];
    const threshold = (2 * 60 + 30) * 60_000;
    const days: OutlierDay[] = [];
    for (let d = budgetEarliestDay; d < today; d = nextDay(d)) {
      const tgt = dailyTarget(events, d);
      if (tgt === null) continue;
      const targetMs = tgt * 60_000;
      const worked = workedPerDay.get(d) ?? 0;
      const delta = worked - targetMs;
      if (Math.abs(delta) > threshold) {
        days.push({ day: d, worked, targetMs, delta });
      }
    }
    return days.reverse();
  });

  const currentTargets = $derived(activeTargets(events, today));
  const currentTargetEvent = $derived(activeTargetEvent(events, today));
  const targetsHistory = $derived(
    events
      .filter(
        (e): e is Extract<WorkEvent, { type: "WorkTargetsSet" }> =>
          e.type === "WorkTargetsSet",
      )
      .sort((a, b) => b.effectiveFrom - a.effectiveFrom),
  );
  const adjustmentHistory = $derived(
    events
      .filter(
        (e): e is Extract<WorkEvent, { type: "FlexAdjusted" }> =>
          e.type === "FlexAdjusted",
      )
      .sort((a, b) => b.at - a.at),
  );
  const overridesHistory = $derived(
    events
      .filter(
        (e): e is Extract<WorkEvent, { type: "TargetOverride" }> =>
          e.type === "TargetOverride",
      )
      .sort((a, b) => b.startDay - a.startDay),
  );
  let targetInputs = $state<Record<string, string>>({
    Mo: "",
    Tu: "",
    We: "",
    Th: "",
    Fr: "",
  });
  let effectiveFromInput = $state("");
  let targetsError = $state<string | null>(null);
  let adjustAmount = $state("");
  let adjustReason = $state("");
  let adjustError = $state<string | null>(null);
  let overrideFrom = $state("");
  let overrideTo = $state("");
  let overrideAmount = $state("");
  let overrideReason = $state("");
  let overrideError = $state<string | null>(null);
  let addDate = $state("");
  let addStartTime = $state("");
  let addEndTime = $state("");
  let addError = $state<string | null>(null);

  function toDateInput(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function fromDateInput(s: string): number {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  }

  function targetsToInputs(
    t: { Mo: number; Tu: number; We: number; Th: number; Fr: number } | null,
  ) {
    const minToHHMM = (m: number) => {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      return `${hh}${mm}`;
    };
    return {
      Mo: t === null ? "" : minToHHMM(t.Mo),
      Tu: t === null ? "" : minToHHMM(t.Tu),
      We: t === null ? "" : minToHHMM(t.We),
      Th: t === null ? "" : minToHHMM(t.Th),
      Fr: t === null ? "" : minToHHMM(t.Fr),
    };
  }

  $effect(() => {
    targetInputs = targetsToInputs(currentTargets);
    if (effectiveFromInput === "") effectiveFromInput = toDateInput(Date.now());
    if (overrideFrom === "") overrideFrom = toDateInput(Date.now());
    if (overrideTo === "") overrideTo = toDateInput(Date.now());
    if (addDate === "") addDate = toDateInput(Date.now());
  });

  function addSessionAnchor(): number {
    const d = fromDateInput(addDate);
    return Number.isNaN(d) ? Date.now() : d;
  }

  const addStartMs = $derived(parseHHMM(addStartTime, addSessionAnchor()));
  const addEndMs = $derived(parseHHMM(addEndTime, addSessionAnchor()));
  const addLengthMs = $derived(
    addStartMs === null || addEndMs === null ? null : addEndMs - addStartMs,
  );

  function handleAddSession() {
    if (addStartMs === null || addEndMs === null) {
      addError = "Use HHMM (e.g. 0900).";
      return;
    }
    const result = validateEdit(
      { startId: "__new__", start: addStartMs, stop: addEndMs },
      sessions,
      Date.now(),
    );
    if (!result.ok) {
      addError = result.reason;
      return;
    }
    addSession(addStartMs, addEndMs);
    events = loadEvents();
    addStartTime = "";
    addEndTime = "";
    addError = null;
  }

  function formatBudget(ms: number): string {
    const sign = ms < 0 ? "-" : "+";
    const total = Math.floor(Math.abs(ms) / 60_000);
    const hh = String(Math.floor(total / 60)).padStart(2, "0");
    const mm = String(total % 60).padStart(2, "0");
    return `${sign}${hh}:${mm}`;
  }

  function parseAdjustAmount(): number | null {
    if (!/^\d{4}$/.test(adjustAmount)) return null;
    const hh = Number(adjustAmount.slice(0, 2));
    const mm = Number(adjustAmount.slice(2, 4));
    if (hh > 23 || mm > 59) return null;
    return (hh * 60 + mm) * 60_000;
  }

  function applyAdjust(sign: 1 | -1) {
    const amount = parseAdjustAmount();
    if (amount === null) {
      adjustError = "Use HHMM (e.g. 0030).";
      return;
    }
    events = [
      ...events,
      appendEvent({
        type: "FlexAdjusted",
        at: Date.now(),
        deltaMs: sign * amount,
        reason: adjustReason,
      }),
    ];
    adjustAmount = "";
    adjustReason = "";
    adjustError = null;
  }

  function saveTargets() {
    const parsed: Record<string, number> = {};
    for (const day of WEEKDAYS) {
      const s = targetInputs[day];
      if (!/^\d{4}$/.test(s)) {
        targetsError = "Use HHMM (e.g. 0800).";
        return;
      }
      const hh = Number(s.slice(0, 2));
      const mm = Number(s.slice(2, 4));
      if (hh > 23 || mm > 59) {
        targetsError = "Use HHMM (e.g. 0800).";
        return;
      }
      parsed[day] = hh * 60 + mm;
    }
    const eff = fromDateInput(effectiveFromInput);
    if (Number.isNaN(eff)) {
      targetsError = "Invalid date.";
      return;
    }
    events = [
      ...events,
      appendEvent({
        type: "WorkTargetsSet",
        at: Date.now(),
        effectiveFrom: eff,
        targets: parsed as {
          Mo: number;
          Tu: number;
          We: number;
          Th: number;
          Fr: number;
        },
      }),
    ];
    targetsError = null;
  }

  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
    }, 1000);
    return () => clearInterval(id);
  });

  function format(ms: number): string {
    const s = Math.floor(ms / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function timeOfDay(ms: number): string {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function hhmm(ms: number): string {
    const minutes = Math.max(0, Math.floor(ms / 60_000));
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function iso(ms: number): string {
    return new Date(ms).toISOString();
  }

  function startEdit(
    startId: string,
    startedAt: number,
    stoppedAt: number | null,
  ) {
    editingId = startId;
    editStart = formatHHMM(startedAt);
    editStop = stoppedAt === null ? "" : formatHHMM(stoppedAt);
    editStartAnchor = startedAt;
    editStopAnchor = stoppedAt ?? 0;
    editError = null;
  }

  function cancelEdit() {
    editingId = null;
    editError = null;
  }

  function deleteSession(session: { startId: string; stopId: string | null }) {
    const ids =
      session.stopId === null
        ? [session.startId]
        : [session.startId, session.stopId];
    removeEvents(ids);
    events = loadEvents();
    if (editingId === session.startId) {
      editingId = null;
      editError = null;
    }
  }

  function saveEdit(session: { startId: string; stopId: string | null }) {
    const start = parseHHMM(editStart, editStartAnchor);
    const stop =
      session.stopId === null ? null : parseHHMM(editStop, editStopAnchor);
    if (start === null || (session.stopId !== null && stop === null)) {
      editError = "Use HHMM (e.g. 0930).";
      return;
    }
    const result = validateEdit(
      { startId: session.startId, start, stop },
      sessions,
      Date.now(),
    );
    if (!result.ok) {
      editError = result.reason;
      return;
    }
    updateEventAt(session.startId, start);
    if (session.stopId !== null && stop !== null)
      updateEventAt(session.stopId, stop);
    events = loadEvents();
    editingId = null;
    editError = null;
  }

  function editedLength(startedAt: number, stoppedAt: number): number {
    const s = parseHHMM(editStart, editStartAnchor);
    const e = parseHHMM(editStop, editStopAnchor);
    if (s === null || e === null) return stoppedAt - startedAt;
    return e - s;
  }

  function start() {
    events = [...events, appendEvent({ type: "WorkStarted", at: Date.now() })];
  }

  function stop() {
    events = [...events, appendEvent({ type: "WorkStopped", at: Date.now() })];
  }

  function loadSample() {
    const next = generateSampleEvents({
      today: Date.now(),
      days: 90,
      seed: Date.now(),
    });
    replaceEvents(next);
    events = next;
  }

  function clearAll() {
    replaceEvents([]);
    events = [];
  }

  function deleteTargets(id: string) {
    removeEvents([id]);
    events = loadEvents();
  }

  function deleteAdjustment(id: string) {
    removeEvents([id]);
    events = loadEvents();
  }

  function deleteOverride(id: string) {
    removeEvents([id]);
    events = loadEvents();
  }

  function parseHHMMMin(s: string): number | null {
    if (!/^\d{4}$/.test(s)) return null;
    const hh = Number(s.slice(0, 2));
    const mm = Number(s.slice(2, 4));
    if (hh > 23 || mm > 59) return null;
    return hh * 60 + mm;
  }

  function applyOverride() {
    const start = fromDateInput(overrideFrom);
    const end = fromDateInput(overrideTo);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      overrideError = "Invalid date.";
      return;
    }
    if (end < start) {
      overrideError = "End must be on or after start.";
      return;
    }
    const target = parseHHMMMin(overrideAmount);
    if (target === null) {
      overrideError = "Use HHMM (e.g. 0800).";
      return;
    }
    events = [
      ...events,
      appendEvent({
        type: "TargetOverride",
        at: Date.now(),
        startDay: start,
        endDay: end,
        targetMin: target,
        reason: overrideReason,
      }),
    ];
    overrideFrom = "";
    overrideTo = "";
    overrideAmount = "";
    overrideReason = "";
    overrideError = null;
  }

  function formatAdjustmentTime(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function importJson(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    const next = parseEventsJson(text);
    replaceEvents(next);
    events = next;
    input.value = "";
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "worktimer-events.json";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<main class="stack">
  <h1>worktimer</h1>

  {#if running}
    <button class="btn" onclick={stop}>Stop session</button>
  {:else}
    <button class="btn" onclick={start}>Start session</button>
  {/if}

  <fieldset>
    <legend>Add session</legend>
    <label>Date <input type="date" bind:value={addDate} /></label>
    <label>
      Session start
      <input
        type="text"
        inputmode="numeric"
        maxlength="4"
        size="4"
        pattern="\d{'{4}'}"
        bind:value={addStartTime}
      />
    </label>
    <label>
      Session end
      <input
        type="text"
        inputmode="numeric"
        maxlength="4"
        size="4"
        pattern="\d{'{4}'}"
        bind:value={addEndTime}
      />
    </label>
    {#if addLengthMs !== null && addLengthMs >= 0}
      <span data-testid="add-session-length">{hhmm(addLengthMs)}</span>
    {/if}
    <button onclick={handleAddSession}>Add session</button>
    {#if addError !== null}
      <p role="alert">{addError}</p>
    {/if}
  </fieldset>

  <details class="stack" style="--stack-space: var(--space-s)">
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
      {#if targetsHistory.length > 0}
        <ul data-testid="targets-history">
          {#each targetsHistory as t (t.id)}
            <li>
              <time datetime={iso(t.effectiveFrom)}
                >{toDateInput(t.effectiveFrom)}</time
              >:
              {#each WEEKDAYS as day, i}
                {day}
                {targetsToInputs(t.targets)[day]}{i < WEEKDAYS.length - 1
                  ? ", "
                  : ""}
              {/each}
              — Week: {hhmm(
                (t.targets.Mo +
                  t.targets.Tu +
                  t.targets.We +
                  t.targets.Th +
                  t.targets.Fr) *
                  60_000,
              )}
              <button onclick={() => deleteTargets(t.id)}>Delete</button>
            </li>
          {/each}
        </ul>
      {/if}
    </fieldset>
    <fieldset>
      <legend>Adjust budget</legend>
      <label>
        Amount
        <input
          type="text"
          inputmode="numeric"
          maxlength="4"
          size="4"
          pattern="\d{'{4}'}"
          bind:value={adjustAmount}
        />
      </label>
      <label>
        Reason
        <input type="text" bind:value={adjustReason} />
      </label>
      <button onclick={() => applyAdjust(1)}>Increase</button>
      <button onclick={() => applyAdjust(-1)}>Decrease</button>
      {#if adjustError !== null}
        <p role="alert">{adjustError}</p>
      {/if}
      {#if adjustmentHistory.length > 0}
        <ul data-testid="adjustment-history">
          {#each adjustmentHistory as adj (adj.id)}
            <li>
              <time datetime={iso(adj.at)}>{formatAdjustmentTime(adj.at)}</time>
              {formatBudget(adj.deltaMs)}
              {#if adj.reason !== ""}— {adj.reason}{/if}
              <button onclick={() => deleteAdjustment(adj.id)}>Delete</button>
            </li>
          {/each}
        </ul>
      {/if}
    </fieldset>
    <fieldset>
      <legend>Target overrides</legend>
      <label>From <input type="date" bind:value={overrideFrom} /></label>
      <label>To <input type="date" bind:value={overrideTo} /></label>
      <label>
        Target
        <input
          type="text"
          inputmode="numeric"
          maxlength="4"
          size="4"
          pattern="\d{'{4}'}"
          bind:value={overrideAmount}
        />
      </label>
      <label
        >Override reason <input
          type="text"
          bind:value={overrideReason}
        /></label
      >
      <button onclick={applyOverride}>Apply override</button>
      {#if overrideError !== null}
        <p role="alert">{overrideError}</p>
      {/if}
      {#if overridesHistory.length > 0}
        <ul data-testid="overrides-history">
          {#each overridesHistory as o (o.id)}
            <li>
              <time datetime={iso(o.startDay)}>{toDateInput(o.startDay)}</time>
              {#if o.endDay !== o.startDay}
                – <time datetime={iso(o.endDay)}>{toDateInput(o.endDay)}</time>
              {/if}
              : {hhmm(o.targetMin * 60_000)}
              {#if o.reason !== ""}— {o.reason}{/if}
              <button onclick={() => deleteOverride(o.id)}>Delete</button>
            </li>
          {/each}
        </ul>
      {/if}
    </fieldset>
  </details>

  <details>
    <summary>Analysis</summary>
    <svg
      data-testid="budget-chart"
      viewBox="0 0 {chartGeom.W} {chartGeom.H}"
      width="100%"
      role="img"
      aria-label="Flex budget over the last 24 weeks"
    >
      {#each chartGridlines as v}
        <line
          data-testid="gridline"
          x1={chartGeom.PL}
          y1={chartGeom.yToPx(v)}
          x2={chartGeom.W - chartGeom.PR}
          y2={chartGeom.yToPx(v)}
          stroke={v === 0 ? "#222" : "cornflowerblue"}
        />
        <text
          x={chartGeom.PL - 4}
          y={chartGeom.yToPx(v) + 4}
          font-size="9"
          text-anchor="end"
          fill="#222">{v === 0 ? "0" : formatBudget(v)}</text
        >
      {/each}
      {#each chartBars as b, i (i)}
        <rect
          data-testid="chart-bar"
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          fill={b.point.delta < 0 ? "crimson" : "teal"}
        />
      {/each}
      <polyline
        data-testid="chart-line"
        points={chartLinePoints}
        fill="none"
        stroke="rebeccapurple"
        stroke-width="2"
      />
      {#each weeklyBudgetSeries as p, i}
        <text
          data-testid="x-tick"
          x={chartGeom.PL + i * chartGeom.step + chartGeom.step / 2}
          y={chartGeom.H - 8}
          font-size="9"
          text-anchor="middle"
          fill="#222">{isoWeekLabel(p.weekStart).slice(5)}</text
        >
      {/each}
    </svg>
    {#if outlierDays.length === 0}
      <p>No past days with |delta| above 02:30.</p>
    {:else}
      <ul data-testid="analysis-outliers">
        {#each outlierDays as d (d.day)}
          <li>
            <time datetime={iso(d.day)}>{toDateInput(d.day)}</time>
            worked {hhmm(d.worked)} / target {hhmm(d.targetMs)} / delta {formatBudget(
              d.delta,
            )}
          </li>
        {/each}
      </ul>
    {/if}
  </details>

  <p>
    Flex budget: <span data-testid="flex-budget">{formatBudget(budgetMs)}</span>
  </p>

  {#snippet sessionRow(session: Session, showWeekday: boolean = false)}
    <li>
      {#if showWeekday}<span
          >{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][
            new Date(session.startedAt).getDay()
          ]}
          {String(new Date(session.startedAt).getDate()).padStart(2, "0")}</span
        >
      {/if}
      {#if editingId === session.startId}
        <label>
          Start
          <input
            type="text"
            inputmode="numeric"
            pattern="\d{'{4}'}"
            maxlength="4"
            size="4"
            bind:value={editStart}
          />
        </label>
        {#if session.stoppedAt !== null}
          <label>
            Stop
            <input
              type="text"
              inputmode="numeric"
              pattern="\d{'{4}'}"
              maxlength="4"
              size="4"
              bind:value={editStop}
            />
          </label>
          (<span data-testid="session-length"
            >{hhmm(editedLength(session.startedAt, session.stoppedAt))}</span
          >)
        {/if}
        <button onclick={() => saveEdit(session)}>Save</button>
        <button onclick={cancelEdit}>Cancel</button>
        {#if editError !== null}
          <p role="alert">{editError}</p>
        {/if}
      {:else}
        <time datetime={iso(session.startedAt)}
          >{timeOfDay(session.startedAt)}</time
        >
        {#if session.stoppedAt !== null}
          - <time datetime={iso(session.stoppedAt)}
            >{timeOfDay(session.stoppedAt)}</time
          >
          (<span data-testid="session-length"
            >{hhmm(session.stoppedAt - session.startedAt)}</span
          >)
        {/if}
        <button
          onclick={() =>
            startEdit(session.startId, session.startedAt, session.stoppedAt)}
          >Edit</button
        >
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
          {isoWeekNumber(week.weekStart)}{" "}{#each week.dayItems as item}<span
              data-day-item
              data-bg={item.bg !== null ? "" : undefined}
              data-month={item.isMonth ? "" : undefined}
              style:background-color={item.bg}
              style:color={item.bg !== null ? item.fg : undefined}
              >{item.text}</span
            >{/each}{" "}<span>{formatHm(week.total)}</span>
          {#if week.delta !== null}
            <span>{formatBudget(week.delta)}</span>
          {/if}
        </summary>
        <ul>
          {#each week.sessions as session (session.startId)}
            {@render sessionRow(session, true)}
          {/each}
        </ul>
      </details>
    {/each}
  </section>

  <section>
    <h2>Import/Export</h2>
    <button onclick={loadSample}
      >Replace current data with generated data</button
    >
    <button onclick={clearAll}>Clear current data</button>
    <label>
      Import JSON
      <input type="file" accept="application/json" onchange={importJson} />
    </label>
    <button onclick={exportJson}>Export JSON</button>
  </section>
</main>
