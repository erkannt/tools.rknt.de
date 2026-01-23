<script lang="ts">
    export let year: number;
    const dates: string[] = [];
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split("T")[0]);
    }
</script>

{#each dates as date}
    <p>{date}</p>
{/each}
