<script lang="ts">
    import Calendar from "./lib/Calendar.svelte";
    const thisYear = () => new Date().getFullYear();

    let year = $state(thisYear());
    let boldMonths = $state(true);
</script>

<main>
    <h1><span>Chunked</span><input type="number" bind:value={year} /></h1>

    <section>
        <p>Simply print this page.</p>
        <label>
            <input type="checkbox" bind:checked={boldMonths} />
            Bold Months
        </label>
        <p>
            Inspired by <a href="https://www.youtube.com/watch?v=BiY2yUwTgQc"
                >a JashiiCorrin video</a
            >.
        </p>
    </section>

    <Calendar {year} {boldMonths} />
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

    @media print {
        main,
        h1 {
            margin: 0;
        }
        h1,
        section {
            display: none;
        }
    }
</style>
