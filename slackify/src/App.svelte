<script lang="ts">
    // Identity slackify function – replace with real implementation later
    const slackify = (input: string): string => input;

    let markdown = $state("");
    let slackified = $derived(slackify(markdown));

    const clear = () => {
        markdown = "";
    };
</script>

<main>
    <header>
        <h1>Slackify</h1>
        <p>Convert Markdown to Slack markup ready for pasting.</p>
    </header>

    <section>
        <textarea
            bind:value={markdown}
            rows="6"
            placeholder="Enter markdown here..."
        ></textarea>

        <button onclick={clear}> Clear </button>
    </section>

    <section>
        <h2>Slackified</h2>
        <pre>{slackified}</pre>
    </section>
</main>
