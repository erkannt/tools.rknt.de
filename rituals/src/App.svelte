<script lang="ts">
  import { LocalStorage } from "./lib/localStorage.svelte";

  interface Ritual {
    id: string;
    name: string;
    markdown: string;
  }

  let rituals = new LocalStorage<Ritual[]>("rituals", []);
  let view: "home" | "add" | "view" | "edit" | "share" | "import" =
    $state("home");
  let currentRitual: Ritual | null = $state(null);
  let name = $state("");
  let markdown = $state("");
  let editingId: string | null = $state(null);
  let deferredPrompt: any = $state(null);
  let canInstall = $state(false);

  let selectedForShare = $state<Set<string>>(new Set());
  let importData = $state<Ritual[]>([]);
  let selectedForImport = $state<Set<string>>(new Set());

  function parseUrl(pathname: string): {
    view: typeof view;
    id: string | null;
    importData?: Ritual[];
  } {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0 || pathname === "/") {
      return { view: "home", id: null };
    }
    if (segments[0] === "add") {
      return { view: "add", id: null };
    }
    if (segments[0] === "share") {
      return { view: "share", id: null };
    }
    if (segments[0] === "import-rituals" && segments[1]) {
      return { view: "import", id: null, importData: [] };
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
    const {
      view: urlView,
      id,
      importData: urlImportData,
    } = parseUrl(window.location.pathname);
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
    } else if (urlView === "import" && urlImportData !== undefined) {
      const encoded = window.location.pathname.split("/import-rituals/")[1];
      if (encoded) {
        decodeRituals(encoded).then((decoded) => {
          importData = decoded;
          selectedForImport = new Set();
        });
      }
    }
  }

  function pushState(path: string) {
    window.history.pushState({}, "", path);
  }

  async function encodeRituals(ritualsToEncode: Ritual[]): Promise<string> {
    const json = JSON.stringify(ritualsToEncode);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);
    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    writer.write(data);
    writer.close();
    const reader = cs.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const compressedBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      compressedBytes.set(chunk, offset);
      offset += chunk.length;
    }
    return btoa(String.fromCharCode(...compressedBytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async function decodeRituals(encoded: string): Promise<Ritual[]> {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    const padded = padding ? base64 + "=".repeat(4 - padding) : base64;
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const ds = new DecompressionStream("gzip");
    const reader = ds.writable.getWriter();
    reader.write(bytes);
    reader.close();
    const decompressedReader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await decompressedReader.read();
      if (done) break;
      chunks.push(value);
    }
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const decompressedBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      decompressedBytes.set(chunk, offset);
      offset += chunk.length;
    }
    const decoder = new TextDecoder();
    const json = decoder.decode(decompressedBytes);
    return JSON.parse(json);
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

  function goToShare() {
    selectedForShare = new Set();
    view = "share";
    pushState("/share");
  }

  function toggleShareSelection(id: string) {
    const newSet = new Set(selectedForShare);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedForShare = newSet;
  }

  async function copyShareLink() {
    const selectedRituals = rituals.current.filter((r: Ritual) =>
      selectedForShare.has(r.id),
    );
    const encoded = await encodeRituals(selectedRituals);
    const url = `${window.location.origin}/import-rituals/${encoded}`;
    await navigator.clipboard.writeText(url);
  }

  function getExistingRitualName(id: string): string | null {
    const existing = rituals.current.find((r: Ritual) => r.id === id);
    return existing ? existing.name : null;
  }

  function toggleImportSelection(id: string) {
    const newSet = new Set(selectedForImport);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedForImport = newSet;
  }

  function importSelected() {
    for (const ritual of importData) {
      if (selectedForImport.has(ritual.id)) {
        const index = rituals.current.findIndex(
          (r: Ritual) => r.id === ritual.id,
        );
        if (index !== -1) {
          rituals.current[index] = ritual;
        } else {
          rituals.current.push(ritual);
        }
      }
    }
    goToHome();
  }

  function cancelImport() {
    goToHome();
  }

  function renderRitualLines(content: string): string[] {
    return content.split("\n").filter((line) => line.trim() !== "");
  }
</script>

<main>
  {#if view === "home"}
    <h1>
      rituals {#if canInstall}<button
          class="install-btn"
          onclick={handleInstall}>Install as App</button
        >{/if}
    </h1>
  {/if}

  {#if view === "add" || view === "edit"}
    <h1>{editingId ? "edit" : "create"} ritual</h1>
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
        <button type="submit">{editingId ? "update" : "create"}</button>
      </div>
    </form>
  {:else if view === "view" && currentRitual}
    <nav>
      <a
        href="/"
        onclick={(e) => {
          e.preventDefault();
          goToHome();
        }}>home</a
      >
      <a
        href="/edit/{currentRitual.id}"
        onclick={(e) => {
          e.preventDefault();
          goToEdit();
        }}>edit</a
      >
    </nav>
    <h1>{currentRitual.name}</h1>
    <div class="rendered-ritual">
      <ul>
        {#each renderRitualLines(currentRitual.markdown) as line}
          <li>
            <input type="checkbox" id="cb-{line}" />
            <label for="cb-{line}">{line}</label>
          </li>
        {/each}
      </ul>
    </div>
  {:else if view === "share"}
    <h1>share rituals</h1>
    {#if rituals.current.length > 0}
      <ul class="rituals-checkbox-list" role="list">
        {#each rituals.current as ritual (ritual.id)}
          <li>
            <input
              type="checkbox"
              id="share-{ritual.id}"
              checked={selectedForShare.has(ritual.id)}
              onchange={() => toggleShareSelection(ritual.id)}
            />
            <label for="share-{ritual.id}">{ritual.name}</label>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="actions">
      <button onclick={copyShareLink}>copy sharable link</button>
      <a
        href="/"
        onclick={(e) => {
          e.preventDefault();
          goToHome();
        }}
        class="button">cancel</a
      >
    </div>
  {:else if view === "import"}
    <h1>import rituals</h1>
    {#if importData.length > 0}
      <ul class="rituals-checkbox-list" role="list">
        {#each importData as ritual (ritual.id)}
          {@const existingName = getExistingRitualName(ritual.id)}
          <li>
            <input
              type="checkbox"
              id="import-{ritual.id}"
              checked={selectedForImport.has(ritual.id)}
              onchange={() => toggleImportSelection(ritual.id)}
            />
            <label for="import-{ritual.id}"
              >{ritual.name}
              {#if existingName}
                (overwrite {existingName})
              {:else}
                (add)
              {/if}</label
            >
          </li>
        {/each}
      </ul>
    {/if}
    <div class="actions">
      <a
        href="/"
        onclick={(e) => {
          e.preventDefault();
          cancelImport();
        }}
        class="button">cancel</a
      >
      <button onclick={importSelected}>import</button>
    </div>
  {:else}
    {#if rituals.current.length > 0}
      <ul class="rituals-button-list" role="list">
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

    <div class="actions">
      <a
        href="/share"
        onclick={(e) => {
          e.preventDefault();
          goToShare();
        }}
        class="button">share</a
      >
      <a
        href="/add"
        onclick={(e) => {
          e.preventDefault();
          goToAdd();
        }}
        class="button">create</a
      >
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 70ch;
    padding: var(--space-m);
    margin-inline: auto;
  }

  nav {
    display: flex;
    justify-content: space-between;
  }

  h1 {
    text-align: center;
  }

  .actions {
    display: flex;
    gap: var(--space-m);
  }

  .install-btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .rituals-button-list {
    list-style: none;
    padding: 0;
    margin-block-end: var(--space-l);

    li {
      margin-block-end: var(--space-2xs);
    }
  }

  .rituals-checkbox-list {
    font-size: var(--step-2);
    padding: 0;

    li {
      display: flex;
      gap: var(--space-xs);
      align-items: center;
      margin-block-end: var(--space-2xs);
    }

    input[type="checkbox"] {
      width: 1em;
      height: 1em;
      accent-color: cornsilk;
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
