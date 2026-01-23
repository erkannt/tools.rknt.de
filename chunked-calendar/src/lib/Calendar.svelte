<script lang="ts">
    import { getDatesForYear, splitIntoQuarters } from "./dates";

    const { year } = $props<{ year: number }>();
    const dates: string[] = $derived(getDatesForYear(year));

    const quarters = $derived.by(() => splitIntoQuarters(dates));
</script>

{#each quarters as quarter}
    <span>Mo</span>
    <span>Tu</span>
    <span>We</span>
    <span>Th</span>
    <span>Fr</span>
    <span>Sa</span>
    <span>Su</span>
    {#each quarter as week}
        {#each week as day}
            <span>{day}</span>
        {/each}
    {/each}
{/each}
