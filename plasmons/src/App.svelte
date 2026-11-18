<script lang="ts">
  import Curve from "./Curve.svelte";
  import { buildLayers, defaultParams, fixed, formatIndex, type Params } from "./lib/layers";
  import { steps } from "./lib/plot";
  import { reflectance } from "./lib/reflectance";

  // Assumption until this becomes an input.
  const angles = steps(40, 80, 0.1); // degrees

  const defaultWavelength = 633; // nm
  let wavelengthInput: number | null = $state(defaultWavelength);
  // An emptied or out-of-range input falls back to the default rather than breaking the curve.
  const wavelength = $derived(
    wavelengthInput != null && wavelengthInput >= 400 && wavelengthInput <= 1000
      ? wavelengthInput
      : defaultWavelength,
  );

  let params: Params = $state({ ...defaultParams });

  const layers = $derived(buildLayers(params));
  const curve = $derived(reflectance(layers, wavelength, angles));
</script>

<main class="stack">
  <h1>Plasmon Curves</h1>

  <div class="with-sidebar" style="--sidebar-width: 30rem">
    <div class="stack" style="--stack-space: var(--space-m)">
      <section class="stack" aria-labelledby="layers-heading" style="--stack-space: var(--space-xs)">
        <h2 id="layers-heading">Layers</h2>

        <fieldset>
          <legend>Cytosol</legend>
          <label>
            Refractive index
            <input type="range" id="cytosol-ri" min="1.34" max="1.40" step="0.001" bind:value={params.cytosolIndex} />
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
            <input type="range" id="media-thickness" min="0" max="150" step="1" bind:value={params.mediaThickness} />
            <output for="media-thickness">{params.mediaThickness}</output>
          </label>
        </fieldset>

        <fieldset>
          <legend>Gold</legend>
          <p>Refractive index: {formatIndex(fixed.goldIndex)}</p>
          <label>
            Thickness (nm)
            <input type="range" id="gold-thickness" min="38" max="55" step="0.5" bind:value={params.goldThickness} />
            <output for="gold-thickness">{params.goldThickness}</output>
          </label>
        </fieldset>

        <fieldset>
          <legend>Chromium</legend>
          <p>Refractive index: {formatIndex(fixed.chromiumIndex)}</p>
          <label>
            Thickness (nm)
            <input type="range" id="chromium-thickness" min="2" max="5" step="0.1" bind:value={params.chromiumThickness} />
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

        <label>
          Wavelength (nm)
          <input type="number" min="400" max="1000" step="1" bind:value={wavelengthInput} />
        </label>
      </section>
    </div>

    <section class="stack" aria-labelledby="curve-heading" style="--stack-space: var(--space-s)">
      <h2 id="curve-heading">Curve</h2>

      <Curve {angles} reflectance={curve} />
    </section>
  </div>
</main>

<style>
  main {
    padding: var(--space-m);
  }

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
