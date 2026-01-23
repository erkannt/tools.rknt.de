<script lang="ts">
    import {
        generateWeekdays,
        getDatesForYear,
        splitIntoQuarters,
    } from "./dates";

    const { year } = $props<{ year: number }>();
    const dates: string[] = $derived(getDatesForYear(year));

    const quarters = $derived.by(() => splitIntoQuarters(dates));

    const weekdays = $derived(generateWeekdays());
</script>

{#each quarters as quarter}
    {#each weekdays as wd}
        <span>{wd}</span>
    {/each}
    {#each quarter as week}
        {#each week as day}
            <span>{day}</span>
        {/each}
    {/each}
{/each}
