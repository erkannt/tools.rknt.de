<script lang="ts">
  interface Ritual {
    id: number;
    name: string;
    markdown: string;
  }

  let rituals: Ritual[] = $state([]);
  let showForm = $state(false);
  let name = $state("");
  let markdown = $state("");
  let nextId = $state(1);

  function addRitual() {
    showForm = true;
  }

  function saveRitual() {
    rituals = [...rituals, { id: nextId, name, markdown }];
    nextId += 1;
    name = "";
    markdown = "";
    showForm = false;
  }
</script>

<main>
  <h1>Rituals</h1>

  {#if showForm}
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
  {:else}
    <button onclick={addRitual}>Add Ritual</button>

    {#if rituals.length > 0}
      <ul>
        {#each rituals as ritual (ritual.id)}
          <li>
            <a href="#">{ritual.name}</a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</main>
