<script lang="ts">
    export let year: number;
    const dates: string[] = [];

    // Helper to get the Monday of the ISO week for a given date
    function getMondayOfISOWeek(date: Date): Date {
        const jsDay = date.getDay(); // 0 (Sun) .. 6 (Sat)
        const isoDay = (jsDay + 6) % 7; // 0 (Mon) .. 6 (Sun)
        const monday = new Date(date);
        monday.setDate(date.getDate() - isoDay);
        return monday;
    }

    // Start on the Monday of the first ISO week (the week containing Jan 4)
    const start = getMondayOfISOWeek(new Date(year, 0, 4));

    // End after the Sunday of the last ISO week (the week containing Dec 28)
    const lastMonday = getMondayOfISOWeek(new Date(year, 11, 28));
    const end = new Date(lastMonday);
    end.setDate(end.getDate() + 7); // exclusive upper bound (next Monday)

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split("T")[0]);
    }
</script>

{#each dates as date}
    <p>{date}</p>
{/each}
