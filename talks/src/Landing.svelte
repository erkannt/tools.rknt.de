<script lang="ts">
  let slides = $state<string[]>([]);
  let error = $state(false);

  fetch("slides/manifest.json")
    .then((r) => r.json())
    .then((data: string[]) => {
      slides = data;
    })
    .catch(() => {
      error = true;
    });

  function displayName(file: string) {
    return file.replace(/\.pdf$/i, "");
  }
</script>

<main class="stack">
  <h1>Talks</h1>
  {#if error}
    <p>Could not load slides.</p>
  {:else if slides.length === 0}
    <p>No slides yet.</p>
  {:else}
    <ul class="slide-list" role="list">
      {#each slides as file}
        <li class="slide-item">
          <span class="slide-name">{displayName(file)}</span>
          <div class="slide-actions">
            <a href="?present={encodeURIComponent(file)}">Present</a>
            <a href="slides/{encodeURIComponent(file)}" download={file}>Download</a>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  main {
    padding: var(--space-l);
    max-width: 60ch;
  }

  .slide-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .slide-item {
    display: flex;
    align-items: baseline;
    gap: var(--space-m);
    padding: var(--space-xs) 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  }

  .slide-name {
    flex: 1;
    font-size: var(--step-1);
  }

  .slide-actions {
    display: flex;
    gap: var(--space-s);
    flex-shrink: 0;
  }
</style>
