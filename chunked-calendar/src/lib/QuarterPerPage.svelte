<script lang="ts">
    import {
        formatDayWithWeekdaySuffix,
        generateWeekdays,
        getDatesForYear,
        isFirstOfMonth,
        splitIntoQuartersWithChunks,
    } from "./dates";

    const { year, boldMonths } = $props<{
        year: number;
        boldMonths: boolean;
    }>();
    const dates: string[] = $derived(getDatesForYear(year));

    const quarters = $derived.by(() => splitIntoQuartersWithChunks(dates));
    $inspect(quarters);

    const weekdays = $derived(generateWeekdays());
</script>

<div class="calendar-grid">
    {#each quarters as quarter}
        <div class="quarter">
            {#each quarter as chunk}
                <div class="chunk">
                    {#each chunk as day}
                        <div
                            class="day"
                            class:boldMonth={isFirstOfMonth(day) && boldMonths}
                        >
                            {formatDayWithWeekdaySuffix(day)}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    {/each}
</div>

<style>
    .calendar-grid {
        display: flex;
        flex-direction: column;
        gap: 2em;
    }

    .chunk {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        grid-template-rows: repeat(7, auto);
        grid-auto-flow: column;
        column-gap: 0.5em;
        justify-items: start;
        align-items: baseline;
        text-align: left;
        margin-bottom: 1em;
        border-top: 3px solid black;
    }

    .boldMonth {
        font-weight: bold;
    }
</style>
