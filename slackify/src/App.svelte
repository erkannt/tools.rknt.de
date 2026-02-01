<script lang="ts">
    import { slackify } from "./slackify";

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
        <button onclick={clear}>Clear</button>
    </section>

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
