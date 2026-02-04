<script lang="ts">
    import "../../tools-landing/styles/main.css";

    type Snippet = {
        id: string;
        title: string;
        content: string;
    };

    var snippets: Snippet[] = [];

    function handleClick() {
        navigator.clipboard
            .writeText("foobar")
            .then(() => {
                window.close();
            })
            .catch((err) => {
                console.error("Failed to copy to clipboard:", err);
            });
    }
</script>

<main>
    <h1>Snippets</h1>
    <button on:click={handleClick}>Copy foobar</button>
    <form>
        <label for="title">Title:</label>
        <input type="text" id="title" name="title" required />

        <label for="content">Content:</label>
        <textarea id="content" name="content" rows="5" required></textarea>

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
