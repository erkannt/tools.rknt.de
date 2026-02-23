<script lang="ts">
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

  function parseUrl(pathname: string): {
    view: typeof view;
    id: string | null;
  } {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0 || pathname === "/") {
      return { view: "home", id: null };
    }
    if (segments[0] === "add") {
      return { view: "add", id: null };
    }
    if (segments[0] === "ritual" && segments[1]) {
      return { view: "view", id: segments[1] };
    }
    if (segments[0] === "edit" && segments[1]) {
      return { view: "edit", id: segments[1] };
    }
    return { view: "home", id: null };
  }

  function syncFromUrl() {
    const { view: urlView, id } = parseUrl(window.location.pathname);
    view = urlView;
    if (urlView === "view" && id) {
      currentRitual = rituals.current.find((r: Ritual) => r.id === id) || null;
    } else if (urlView === "edit" && id) {
      editingId = id;
      const ritual = rituals.current.find((r: Ritual) => r.id === id) || null;
      if (ritual) {
        name = ritual.name;
        markdown = ritual.markdown;
      }
    }
  }

  function pushState(path: string) {
    window.history.pushState({}, "", path);
  }

  if (typeof window !== "undefined") {
    window.addEventListener("popstate", syncFromUrl);
    syncFromUrl();

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
    pushState("/add");
  }

  function goToHome() {
    view = "home";
    currentRitual = null;
    pushState("/");
  }

  function viewRitual(ritual: Ritual) {
    currentRitual = ritual;
    view = "view";
    pushState(`/ritual/${ritual.id}`);
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
    pushState("/");
  }

  function goToEdit() {
    if (currentRitual) {
      name = currentRitual.name;
      markdown = currentRitual.markdown;
      editingId = currentRitual.id;
      view = "edit";
      pushState(`/edit/${currentRitual.id}`);
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
      pushState("/");
    }
  }

  function renderRitualLines(content: string): string[] {
    return content.split("\n").filter((line) => line.trim() !== "");
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
      <div class="edit-ritual-inputs">
        <label for="name-input">name</label>
        <input id="name-input" type="text" bind:value={name} required />

        <label for="text">ritual</label>
        <textarea id="text" bind:value={markdown} style="resize: vertical;"
        ></textarea>
      </div>
      <div class="edit-actions">
        {#if editingId}
          <button type="button" onclick={deleteRitual}>delete</button>
        {/if}
        <button type="submit">{editingId ? "update" : "save"}</button>
      </div>
    </form>
  {:else if view === "view" && currentRitual}
    <nav>
      <a
        href="/"
        onclick={(e) => {
          e.preventDefault();
          goToHome();
        }}>Home</a
      >
      <a
        href="/edit/{currentRitual.id}"
        onclick={(e) => {
          e.preventDefault();
          goToEdit();
        }}>Edit</a
      >
    </nav>
    <h1>{currentRitual.name}</h1>
    <div class="rendered-ritual">
      <ul>
        {#each renderRitualLines(currentRitual.markdown) as line}
          <li><input type="checkbox" /><span>{line}</span></li>
        {/each}
      </ul>
    </div>
  {:else}
    {#if rituals.current.length > 0}
      <ul class="rituals-list" role="list">
        {#each rituals.current as ritual (ritual.id)}
          <li>
            <a
              class="button"
              href="/ritual/{ritual.id}"
              onclick={(e) => {
                e.preventDefault();
                viewRitual(ritual);
              }}>{ritual.name}</a
            >
          </li>
        {/each}
      </ul>
    {/if}

    <a
      href="/add"
      onclick={(e) => {
        e.preventDefault();
        goToAdd();
      }}
      class="button">add ritual</a
    >
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
    padding: 0;
    margin-block-end: var(--space-l);

    li {
      margin-block-end: var(--space-2xs);
    }
  }

  button,
  .button {
    display: block;
    width: 100%;
    padding-block: var(--space-xs);
    border-radius: 3px;
    border: 0;
    background: cornsilk;
  }

  .button {
    text-align: center;
    text-decoration: none;
    color: inherit;
  }

  .button:hover,
  button:hover {
    background-color: oklch(from cornsilk calc(l * 0.95) c h);
  }

  .edit-ritual-inputs {
    display: flex;
    flex-direction: column;
    margin-block-end: var(--space-l);

    label {
      margin-block-end: var(--space-3xs);
    }
    input,
    textarea {
      margin-block-end: var(--space-m);
    }
  }

  .edit-actions {
    display: flex;
    gap: var(--space-m);
  }
</style>
