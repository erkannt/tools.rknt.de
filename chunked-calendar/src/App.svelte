<script lang="ts">
    import Calendar from "./lib/Calendar.svelte";
    const thisYear = () => new Date().getFullYear();

    let year = $state(thisYear());
    let boldMonths = $state(true);
    let quarterPerPage = $state(false);
</script>

<main>
    <h1><span>Chunked</span><input type="number" bind:value={year} /></h1>

    <section>
        <label>
            <input type="checkbox" bind:checked={boldMonths} />
            Bold Months
        </label>
        <label>
            <input type="checkbox" bind:checked={quarterPerPage} />
            One Quarter per Page
        </label>
        <p>Simply print this page.</p>
    </section>

    <Calendar {year} {boldMonths} {quarterPerPage} />
    <footer>
        <p>
            Inspired by <a href="https://www.youtube.com/watch?v=BiY2yUwTgQc"
                >a JashiiCorrin video</a
            >
        </p>
    </footer>
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

    footer {
        margin-top: var(--space-2xl);
        margin-bottom: var(--space-2xl);
        padding-top: var(--space-l);
        border-top: 1px solid black;
    }

    @media print {
        main,
        h1 {
            margin: 0;
        }
        h1,
        section,
        footer {
            display: none;
        }
    }
</style>
