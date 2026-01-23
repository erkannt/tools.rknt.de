<script lang="ts">
    import Calendar from "./lib/Calendar.svelte";
    const thisYear = () => new Date().getFullYear();

    const year = $state(thisYear());
</script>

<main>
    <h1>Chunked {year}</h1>

    <p>Simply print this page.</p>
    <p>
        Inspired by <a href="https://www.youtube.com/watch?v=BiY2yUwTgQc"
            >a JashiiCorrin video</a
        >.
    </p>
    <Calendar />
</main>
