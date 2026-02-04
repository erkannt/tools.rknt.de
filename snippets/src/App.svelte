<script lang="ts">
    import "../../tools-landing/styles/main.css";

    type Snippet = {
        id: string;
        title: string;
        content: string;
    };

    let snippets = $state<Snippet[]>([]);

    let title = $state("");
    let content = $state("");

    function addSnippet(event: SubmitEvent) {
        event.preventDefault();

        if (!title.trim() || !content.trim()) {
            return;
        }

        snippets = [
            ...snippets,
            {
                id: crypto.randomUUID(),
                title,
                content,
            },
        ];

        // Reset form fields
        title = "";
        content = "";
    }

    function copyToClipboard(text: string) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                window.close();
            })
            .catch((err) => {
                console.error("Failed to copy to clipboard:", err);
            });
    }
</script>

<main class="stack">
    <h1>Snippets</h1>

    <section>
        {#if snippets.length}
            <ul>
                {#each snippets as snippet (snippet.id)}
                    <li>
                        <button
                            onclick={() => copyToClipboard(snippet.content)}
                        >
                            {snippet.title}
                        </button>
                    </li>
                {/each}
            </ul>
        {:else}
            <p>No saved snippets</p>
        {/if}
    </section>

    <form onsubmit={addSnippet}>
        <label for="title">Title:</label>
        <input
            type="text"
            id="title"
            name="title"
            bind:value={title}
            required
        />

        <label for="content">Content:</label>
        <textarea
            id="content"
            name="content"
            rows="5"
            bind:value={content}
            required
        ></textarea>

        <button type="submit">Add Snippet</button>
    </form>
</main>

<style>
    form {
        display: flex;
        flex-direction: column;

        label {
            margin-block-end: var(--space-2xs);
        }

        input,
        textarea {
            margin-block-end: var(--space-s);
        }

        button {
            padding-block: var(--space-2xs);
        }
    }
</style>
