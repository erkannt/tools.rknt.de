<script lang="ts">
    import "../../tools-landing/styles/main.css";

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
</main>
