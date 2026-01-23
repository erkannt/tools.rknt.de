<script lang="ts">
    import { getDatesForYear } from "./dates";

    const { year } = $props<{ year: number }>();
    const dates: string[] = $derived(getDatesForYear(year));
</script>

{#each dates as date}
    <p>{date}</p>
{/each}
