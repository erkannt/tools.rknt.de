<script lang="ts">
  import {
    parseCssVariables,
    generateCombinations,
    categorizePairs,
    generateUtilityClassesForCategory,
    type ParsedColor,
    type WcagCategory,
  } from "./lib/contrast";

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
        <li
          class="pair-item"
          style="background-color: {pair.background.value}; color: {pair
            .foreground.value};"
        >
          <span class="pair-names"
            >{pair.foreground.name}<br /> on {pair.background.name}</span
          >
          <span class="pair-ratio">{pair.ratio.toFixed(2)}:1</span>
        </li>
      {/each}
    </ul>
    <button
      onclick={() =>
        copyToClipboard(generateUtilityClassesForCategory(category))}
    >
      Copy {category.name} utility classes
    </button>
  {/if}
{/each}

<style>
  textarea {
    width: 100%;
    height: 12.5rem;
    font-family: monospace;
    padding: var(--space-s);
    border: 1px solid #ccc;
    border-radius: var(--radius);
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-s);
    margin-bottom: var(--space-l);
  }

  .color-swatch {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }

  .swatch {
    width: 100%;
    height: 3.75rem;
    border-radius: var(--radius);
  }

  .color-name {
    font-weight: bold;
    font-size: var(--step--1);
  }

  .color-value {
    font-size: var(--step--2);
    color: #666;
    font-family: monospace;
  }

  .pair-list {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--space-s) 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-xs);
  }

  .pair-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--radius);
  }

  .pair-names {
    font-size: var(--step-1);
    font-weight: bold;
  }

  .pair-ratio {
    font-size: var(--step-1);
  }

  button {
    margin-bottom: var(--space-m);
    padding: var(--space-2xs) var(--space-s);
    cursor: pointer;
  }
</style>
