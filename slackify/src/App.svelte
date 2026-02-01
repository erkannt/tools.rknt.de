<script lang="ts">
    let markdown = $state("");
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
</main>
