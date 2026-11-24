<script lang="ts">
  import { fixed, paramRanges, wavelength } from "./lib/constants";
  import { formatIndex, type Params } from "./lib/layers";

  let { params = $bindable() }: { params: Params } = $props();
</script>

<section class="stack" aria-labelledby="layers-heading" style="--stack-space: var(--space-xs)">
  <h2 id="layers-heading">Layers</h2>

  <fieldset>
    <legend>Cytosol</legend>
    <label>
      Refractive index
      <input type="range" id="cytosol-ri" {...paramRanges.cytosolIndex} bind:value={params.cytosolIndex} />
      <output for="cytosol-ri">{params.cytosolIndex.toFixed(3)}</output>
    </label>
    <p>Thickness: ∞</p>
  </fieldset>

  <fieldset>
    <legend>Membrane</legend>
    <p>Refractive index: {formatIndex(fixed.membraneIndex)}</p>
    <p>Thickness: {fixed.membraneThickness} nm</p>
  </fieldset>

  <fieldset>
    <legend>Media</legend>
    <p>Refractive index: {formatIndex(fixed.mediaIndex)}</p>
    <label>
      Thickness (nm)
      <input type="range" id="media-thickness" {...paramRanges.mediaThickness} bind:value={params.mediaThickness} />
      <output for="media-thickness">{params.mediaThickness}</output>
    </label>
  </fieldset>

  <fieldset>
    <legend>Gold</legend>
    <p>Refractive index: {formatIndex(fixed.goldIndex)}</p>
    <label>
      Thickness (nm)
      <input type="range" id="gold-thickness" {...paramRanges.goldThickness} bind:value={params.goldThickness} />
      <output for="gold-thickness">{params.goldThickness}</output>
    </label>
  </fieldset>

  <fieldset>
    <legend>Chromium</legend>
    <p>Refractive index: {formatIndex(fixed.chromiumIndex)}</p>
    <label>
      Thickness (nm)
      <input type="range" id="chromium-thickness" {...paramRanges.chromiumThickness} bind:value={params.chromiumThickness} />
      <output for="chromium-thickness">{params.chromiumThickness}</output>
    </label>
  </fieldset>

  <fieldset>
    <legend>Coverslip</legend>
    <p>Refractive index: {formatIndex(fixed.coverslipIndex)}</p>
    <p>Thickness: ∞</p>
  </fieldset>
</section>

<section class="stack" aria-labelledby="light-heading" style="--stack-space: var(--space-xs)">
  <h2 id="light-heading">Light</h2>

  <p>Wavelength: {wavelength} nm</p>
</section>

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

  fieldset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs) var(--space-s);

    > * {
      flex: 1 1 8rem;
    }

    p {
      margin: 0;
    }
  }
</style>
