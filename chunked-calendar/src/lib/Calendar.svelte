<script lang="ts">
    import {
        formatDay,
        generateWeekdays,
        getDatesForYear,
        splitIntoQuarters,
        isFirstOfMonth,
    } from "./dates";

    const { year, boldMonths } = $props<{
        year: number;
        boldMonths: boolean;
    }>();
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
                        <div
                            class="day"
                            class:boldMonth={isFirstOfMonth(day) && boldMonths}
                        >
                            {formatDay(day)}
                        </div>
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
        gap: 2em;
    }

    .quarter {
        display: flex;
        flex-direction: column;
        gap: 0.1em;
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
        margin-bottom: 0.5em;
    }

    .weekday {
        font-weight: bold;
        border-bottom: 3px solid black;
        flex: 1;
        text-align: center;
    }

    .boldMonth {
        font-weight: bold;
    }

    .day {
        flex: 1;
        text-align: center;
    }

    /* Ensure the calendar fits on a single printed page by scaling font size and preventing page breaks */
    @media print {
        /* Dynamically scale font size based on page dimensions */
        .calendar-grid {
            font-size: calc(90vh / 50);
            break-inside: avoid;
            page-break-inside: avoid;
            margin: 0;
        }

        /* Prevent page breaks inside quarters and weeks */
        .quarter,
        .week {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        /* Optional: set page margins to maximize usable area */
        @page {
            margin: 1cm;
        }
    }
</style>
