<script lang="ts">
    import Calendar from "./lib/Calendar.svelte";
    const thisYear = () => new Date().getFullYear();

    let year = $state(thisYear());
</script>

<main>
    <h1><span>Chunked</span><input type="number" bind:value={year} /></h1>

    <section>
        <p>Simply print this page.</p>
        <p>
            Inspired by <a href="https://www.youtube.com/watch?v=BiY2yUwTgQc"
                >a JashiiCorrin video</a
            >.
        </p>
    </section>
    <Calendar />
</main>

<style>
    h1 {
        display: flex;
        align-items: baseline;
        gap: var(--space-s);
    }

    h1 input {
        border: 3px solid currentColor;
        font-size: inherit;
        appearance: textfield;
        width: 5ch;
        text-align: center;
    }

    section {
        margin-bottom: var(--space-xl);
    }
</style>
