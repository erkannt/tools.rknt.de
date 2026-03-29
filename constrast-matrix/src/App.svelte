<script lang="ts">
  import { parseCssVariables, generateCombinations, categorizePairs, generateUtilityClassesForCategory, type ParsedColor, type WcagCategory } from './lib/contrast';

  const exampleInput = `--red: #cc4c19;
--green: #365a31;
--blue: #3279bc;
--darkblue: #263e45;
--yellow: #d19815;
--cyan: #28bfce;

--white: #fdf9f0;
--black: #1e2e34;
`;

  let input = $state(exampleInput);
  let colors = $derived(parseCssVariables(input));
  let categories = $derived(categorizePairs(generateCombinations(colors)));

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }
</script>

<h1>Contrast Matrix</h1>
<form onsubmit={(e) => e.preventDefault()}>
  <textarea bind:value={input}></textarea>
</form>

<h2>Your Colours</h2>
{#if colors.length > 0}
  <div class="color-grid">
    {#each colors as color}
      <div class="color-swatch">
        <div class="swatch" style="background-color: {color.value}"></div>
        <span class="color-name">--{color.name}</span>
        <span class="color-value">{color.value}</span>
      </div>
    {/each}
  </div>
{:else}
  <p>No valid CSS variables found. Add some --name: #value; pairs above.</p>
{/if}

<h2>Possible combinations</h2>

{#each categories as category}
  <h3>{category.name}</h3>
  {#if category.pairs.length > 0}
    <ul class="pair-list">
      {#each category.pairs as pair}
        <li class="pair-item" style="background-color: {pair.background.value}; color: {pair.foreground.value};">
          <span class="pair-names">{pair.foreground.name} on {pair.background.name}</span>
          <span class="pair-ratio">{pair.ratio.toFixed(2)}:1</span>
        </li>
      {/each}
    </ul>
    <button onclick={() => copyToClipboard(generateUtilityClassesForCategory(category))}>
      Copy {category.name} utility classes
    </button>
  {/if}
{/each}

<style>
  textarea {
    width: 100%;
    height: 200px;
    font-family: monospace;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .color-swatch {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .swatch {
    width: 100%;
    height: 60px;
    border-radius: 4px;
    border: 1px solid rgba(0,0,0,0.1);
  }

  .color-name {
    font-weight: bold;
    font-size: 0.875rem;
  }

  .color-value {
    font-size: 0.75rem;
    color: #666;
    font-family: monospace;
  }

  .pair-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  .pair-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    border: 1px solid rgba(0,0,0,0.1);
  }

  .pair-names {
    font-size: 0.875rem;
  }

  .pair-ratio {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  button {
    margin-bottom: 1.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }
</style>
