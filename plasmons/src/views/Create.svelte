<script lang="ts">
  import Curve from "../Curve.svelte";
  import ParamControls from "../ParamControls.svelte";
  import { angleRange, defaultNoise, defaultParams, noiseRange, wavelength } from "../lib/constants";
  import { buildLayers, type Params } from "../lib/layers";
  import { steps } from "../lib/plot";
  import { reflectance } from "../lib/reflectance";

  const angles = steps(angleRange.min, angleRange.max, angleRange.step); // degrees

  let params: Params = $state({ ...defaultParams });
  let noise = $state(defaultNoise);

  const layers = $derived(buildLayers(params));
  const curve = $derived(reflectance(layers, wavelength, angles));
</script>

<div class="with-sidebar" style="--sidebar-width: 30rem">
  <div class="stack" style="--stack-space: var(--space-m)">
    <ParamControls bind:params />

    <section class="stack" aria-labelledby="noise-heading" style="--stack-space: var(--space-xs)">
      <h2 id="noise-heading">Noise</h2>

      <label>
        Standard deviation
        <input type="range" id="noise-sd" {...noiseRange} bind:value={noise} />
        <output for="noise-sd">{noise.toFixed(3)}</output>
      </label>

      <div class="buttons">
        <button type="button">Re-roll</button>
        <button type="button">Copy link</button>
      </div>
    </section>
  </div>

  <section class="stack" aria-labelledby="curve-heading" style="--stack-space: var(--space-s)">
    <h2 id="curve-heading">Curve</h2>

    <Curve {angles} reflectance={curve} />
  </section>
</div>

<style>
  label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
  }

  input[type="range"] {
    flex: 1 1 6rem;
    min-inline-size: 0;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
  }
</style>
