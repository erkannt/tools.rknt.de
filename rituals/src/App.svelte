<script lang="ts">
  import { marked } from "marked";

  interface Ritual {
    id: number;
    name: string;
    markdown: string;
  }

  let rituals: Ritual[] = $state([]);
  let view: "home" | "add" | "view" = $state("home");
  let currentRitual: Ritual | null = $state(null);
  let name = $state("");
  let markdown = $state("");
  let nextId = $state(1);

  function goToAdd() {
    view = "add";
  }

  function goToHome() {
    view = "home";
    currentRitual = null;
  }

  function viewRitual(ritual: Ritual) {
    currentRitual = ritual;
    view = "view";
  }

  function saveRitual() {
    rituals = [...rituals, { id: nextId, name, markdown }];
    nextId += 1;
    name = "";
    markdown = "";
    view = "home";
  }

  function renderMarkdown(content: string): string {
    return marked.parse(content) as string;
  }
</script>

<main>
  {#if view !== "view"}
    <h1>Rituals</h1>
  {/if}

  {#if view === "add"}
    <form
      onsubmit={(e) => {
        e.preventDefault();
        saveRitual();
      }}
    >
      <div>
        <label>
          Name:
          <input type="text" bind:value={name} />
        </label>
      </div>
      <div>
        <textarea bind:value={markdown}></textarea>
      </div>
      <button type="submit">Save</button>
    </form>
  {:else if view === "view" && currentRitual}
    <a href="#" onclick={goToHome}>Back to Home</a>
    <h1>{currentRitual.name}</h1>
    <div>{@html renderMarkdown(currentRitual.markdown)}</div>
  {:else}
    {#if rituals.length > 0}
      <ul>
        {#each rituals as ritual (ritual.id)}
          <li>
            <a href="#" onclick={() => viewRitual(ritual)}>{ritual.name}</a>
          </li>
        {/each}
      </ul>
    {/if}

    <button onclick={goToAdd}>Add Ritual</button>
  {/if}
</main>
