<script lang="ts">
    import { slackify } from "./slackify";

    let markdown = $state("");
    let slackified = $derived(slackify(markdown));

    const clear = () => {
        markdown = "";
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(slackified);
            // Optionally provide feedback to the user
            // e.g., console.log('Copied to clipboard');
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };
</script>

<main>
    <header>
        <h1>Slackify</h1>
        <p>Convert Markdown to Slack markup ready for pasting.</p>
        <button onclick={clear}>Clear Input</button>
        <button onclick={copy}>Copy Output</button>
    </header>

    <section>
        <h2>Markdown</h2>
        <textarea
            bind:value={markdown}
            rows="12"
            placeholder="Enter markdown here..."
        ></textarea>
    </section>

    <section id="slackified-output">
        <h2>Slackified</h2>
        <pre>{slackified}</pre>
    </section>
</main>

<style>
    #slackified-output {
        pre {
            border: 1px solid black;
            min-height: 20rem;
            overflow: scroll;
        }
    }
</style>
