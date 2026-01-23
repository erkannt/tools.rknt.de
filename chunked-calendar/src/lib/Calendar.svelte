<script lang="ts">
    import { getDatesForYear } from "./dates";

    const { year } = $props<{ year: number }>();
    const dates: string[] = $derived(getDatesForYear(year));

    // Derive quarters: each quarter = 13 weeks, each week = 7 days
    const quarters = $derived.by(() => {
        const daysPerWeek = 7;
        const weeksPerQuarter = 13;
        const daysPerQuarter = daysPerWeek * weeksPerQuarter;

        const result: string[][][] = []; // quarters → weeks → days

        for (let i = 0; i < dates.length; i += daysPerQuarter) {
            const quarterDays = dates.slice(i, i + daysPerQuarter);
            const weeks: string[][] = [];

            for (let j = 0; j < quarterDays.length; j += daysPerWeek) {
                weeks.push(quarterDays.slice(j, j + daysPerWeek));
            }

            result.push(weeks);
        }

        return result;
    });
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
