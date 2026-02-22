<script lang="ts">
  import { marked } from "marked";
  import { LocalStorage } from "./lib/localStorage.svelte";

  interface Ritual {
    id: string;
    name: string;
    markdown: string;
  }

  let rituals = new LocalStorage<Ritual[]>("rituals", []);
  let view: "home" | "add" | "view" | "edit" = $state("home");
  let currentRitual: Ritual | null = $state(null);
  let name = $state("");
  let markdown = $state("");
  let editingId: string | null = $state(null);
  let deferredPrompt: any = $state(null);
  let canInstall = $state(false);

  if (typeof window !== "undefined") {
    console.log("in window");
    window.addEventListener("beforeinstallprompt", (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      canInstall = true;
      console.log("before install");
    });

    window.addEventListener("appinstalled", () => {
      canInstall = false;
      deferredPrompt = null;
    });
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  }

  function goToAdd() {
    name = "";
    markdown = "";
    editingId = null;
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
    if (editingId) {
      const updated = rituals.current.map((r: Ritual) =>
        r.id === editingId ? { ...r, name, markdown } : r,
      );
      rituals.current.length = 0;
      rituals.current.push(...updated);
    } else {
      rituals.current.push({ id: crypto.randomUUID(), name, markdown });
    }
    name = "";
    markdown = "";
    editingId = null;
    view = "home";
  }

  function goToEdit() {
    if (currentRitual) {
      name = currentRitual.name;
      markdown = currentRitual.markdown;
      editingId = currentRitual.id;
      view = "edit";
    }
  }

  function deleteRitual() {
    if (editingId) {
      const index = rituals.current.findIndex(
        (r: Ritual) => r.id === editingId,
      );
      if (index !== -1) {
        rituals.current.splice(index, 1);
      }
      name = "";
      markdown = "";
      editingId = null;
      view = "home";
    }
  }

  function renderMarkdown(content: string): string {
    return marked.parse(content) as string;
  }
</script>

<main>
  {#if view !== "view"}
    <h1>
      rituals {#if canInstall}<button
          class="install-btn"
          onclick={handleInstall}>Install as App</button
        >{/if}
    </h1>
  {/if}

  {#if view === "add" || view === "edit"}
    <form
      onsubmit={(e) => {
        e.preventDefault();
        saveRitual();
      }}
    >
      <div>
        <label>
          Name:
          <input type="text" bind:value={name} required />
        </label>
      </div>
      <div>
        <textarea bind:value={markdown}></textarea>
      </div>
      <button type="submit">{editingId ? "Update" : "Save"}</button>
      {#if editingId}
        <button type="button" onclick={deleteRitual}>Delete</button>
      {/if}
    </form>
  {:else if view === "view" && currentRitual}
    <nav>
      <a href="#" onclick={goToHome}>Home</a>
      <a href="#" onclick={goToEdit}>Edit</a>
    </nav>
    <h1>{currentRitual.name}</h1>
    <div>{@html renderMarkdown(currentRitual.markdown)}</div>
  {:else}
    {#if rituals.current.length > 0}
      <ul class="rituals-list" role="list">
        {#each rituals.current as ritual (ritual.id)}
          <li>
            <button onclick={() => viewRitual(ritual)}>{ritual.name}</button>
          </li>
        {/each}
      </ul>
    {/if}

    <button onclick={goToAdd}>add ritual</button>
  {/if}
</main>

<style>
  main {
    max-width: 70ch;
    padding-inline: var(--space-m);
    margin-inline: auto;
  }

  nav {
    display: flex;
    justify-content: space-between;
  }

  h1 {
    text-align: center;
  }

  .install-btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .rituals-list {
    list-style: none;
    padding-inline: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    margin-block-end: var(--space-l);
  }

  button {
    display: block;
    width: 100%;
    padding-block: var(--space-xs);
    border-radius: 3px;
    border: 0;
  }
</style>
