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
        <p>Convert Markdown to Slack markup ready for pasting</p>
        <div class="button-wrapper">
            <button onclick={clear}>Clear Input</button>
            <button onclick={copy}>Copy Output</button>
        </div>
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

    <footer>
        <a href="https://github.com/erkannt/slackify">Source Code</a>
    </footer>
</main>

<style>
    header {
        h1,
        p {
            margin-bottom: var(--space-m);
        }

        margin-bottom: var(--space-xl);
    }

    .button-wrapper {
        display: flex;
        gap: var(--space-s);
    }

    button {
        padding-inline: var(--space-xs);
        padding-block: var(--space-3xs);
    }

    h2 {
        margin-bottom: var(--space-s);
    }

    textarea {
        width: 100%;
        box-sizing: border-box;
        resize: vertical; /* allow only vertical resizing */
    }

    #slackified-output {
        margin-bottom: var(--space-3xl);

        pre {
            border: 1px solid black;
            min-height: 20rem;
            overflow: scroll;
            background-color: lightgrey;
        }
    }

    footer {
        margin-top: var(--space-3xl);
        border-top: 1px solid black;
        padding-top: var(--space-l);
    }
</style>
