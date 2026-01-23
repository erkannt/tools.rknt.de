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
            {#each weekdays as wd}
                <div class="weekday">{wd}</div>
            {/each}
            {#each quarter as week}
                {#each week as day}
                    <div>{formatDay(day)}</div>
                {/each}
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
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        row-gap: 0.5rem;
    }

    /* larger gap after 5th, 9th, and 13th rows */
    .quarter > :nth-child(35),
    .quarter > :nth-child(63),
    .quarter > :nth-child(91) {
        margin-bottom: var(--space-m);
    }

    .weekday {
        font-weight: bold;
        border-bottom: 3px solid black;
    }
</style>
