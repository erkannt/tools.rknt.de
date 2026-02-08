<script lang="ts">
    import FullYearOnePage from "./lib/FullYearOnePage.svelte";
    import QuarterPerPage from "./lib/QuarterPerPage.svelte";
    const thisYear = () => new Date().getFullYear();

    let year = $state(thisYear());
    let boldMonths = $state(true);
    let quarterPerPage = $state(false);
</script>

<main class="stack">
    <h1><span>Chunked</span><input type="number" bind:value={year} /></h1>

    <details>
        <summary>what is this</summary>
        <p>
            Weeks are great but too short for certain routines or goals. Years
            are too long. Quarters are great but being built from months they
            are rubbish. Months have different lengths and don't start on
            Mondays.
        </p>
        <p>ISO Weeks to the rescue. We this calendar splits the year into:</p>
        <ul>
            <li>four quarters</li>
            <li>each quarter into three chunks of four weeks</li>
            <li>quarters end with a reset week</li>
        </ul>
        <p>
            Every couple of years we get a year with 53 ISO weeks. The extra
            week becomes a second reset week in the fourth quarter.
        </p>
        <p>
            The calender comes in two print friendly forms and should adapt to
            whatever papersize you select when printing.
        </p>
    </details>

    <section>
        <label>
            <input type="checkbox" bind:checked={boldMonths} />
            Bold Months
        </label>
        <label>
            <input type="checkbox" bind:checked={quarterPerPage} />
            One Quarter per Page
        </label>
    </section>

    {#if quarterPerPage}
        <QuarterPerPage {year} {boldMonths} />
    {:else}
        <FullYearOnePage {year} {boldMonths} />
    {/if}
    <footer>
        <p>
            <a href="https://github.com/erkannt/tools.rknt.de/chunked-calendar"
                >Source Code</a
            >
        </p>
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
