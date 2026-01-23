<script lang="ts">
    import {
        formatDay,
        generateWeekdays,
        getDatesForYear,
        splitIntoQuarters,
    } from "./dates";

    const { year } = $props<{ year: number }>();
    const dates: string[] = $derived(getDatesForYear(year));

    const quarters = $derived.by(() => splitIntoQuarters(dates));

    const weekdays = $derived(generateWeekdays());
</script>

<div class="calendar-grid">
    {#each quarters as quarter}
        <div class="quarter">
            <div class="weekday-row">
                {#each weekdays as wd}
                    <div class="weekday">{wd}</div>
                {/each}
            </div>
            {#each quarter as week}
                <div class="week">
                    {#each week as day}
                        <div class="day">{formatDay(day)}</div>
                    {/each}
                </div>
            {/each}
        </div>
    {/each}
</div>

<style>
    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-l);
    }

    .quarter {
        display: flex;
        flex-direction: column;
        gap: var(--space-2xs);
        text-align: center;
    }

    .weekday-row,
    .week {
        display: flex;
        justify-content: space-between;
    }

    /* Add margin‑bottom to the 5th, 9th, and 13th week rows */
    .quarter .week:nth-child(5),
    .quarter .week:nth-child(9),
    .quarter .week:nth-child(13) {
        margin-bottom: var(--space-xs);
    }

    .weekday {
        font-weight: bold;
        border-bottom: 3px solid black;
        flex: 1;
        text-align: center;
    }

    .day {
        flex: 1;
        text-align: center;
    }
</style>
