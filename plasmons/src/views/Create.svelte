<script lang="ts">
  import Curve from "../Curve.svelte";
  import ParamControls from "../ParamControls.svelte";
  import { angleRange, defaultNoise, defaultParams, noiseRange, wavelength } from "../lib/constants";
  import { buildLayers, type Params } from "../lib/layers";
  import { encodeSimulation } from "../lib/link";
  import { steps } from "../lib/plot";
  import { randomSeed } from "../lib/random";
  import { reflectance } from "../lib/reflectance";
  import { pointAngles, simulate } from "../lib/simulate";

  const angles = steps(angleRange.min, angleRange.max, angleRange.step); // degrees

  let params: Params = $state({ ...defaultParams });
  let noise = $state(defaultNoise);
  // Kept while the sliders move, so the points follow the curve instead of jumping around.
  let seed = $state(randomSeed());

  const layers = $derived(buildLayers(params));
  const curve = $derived(reflectance(layers, wavelength, angles));
  const points = $derived(simulate({ params, noise, seed }));

  const link = $derived(`${location.origin}${location.pathname}#/fit/${encodeSimulation({ params, noise, seed })}`);

  let copyStatus: "idle" | "copied" | "failed" = $state("idle");
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function copyLink() {
    clearTimeout(resetTimer);
    try {
      await navigator.clipboard.writeText(link);
      copyStatus = "copied";
      resetTimer = setTimeout(() => (copyStatus = "idle"), 2000);
    } catch {
      // The clipboard API needs a secure context and permission; let the user copy by hand instead.
      copyStatus = "failed";
    }
  }
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
        <button type="button" onclick={() => (seed = randomSeed())}>Re-roll</button>
        <button type="button" onclick={copyLink}>Copy link</button>
        <span role="status">{copyStatus === "copied" ? "Copied" : ""}</span>
      </div>

      {#if copyStatus === "failed"}
        <label>
          Couldn't copy automatically, copy this link instead:
          <input type="text" readonly value={link} onfocus={(e) => e.currentTarget.select()} />
        </label>
      {/if}
    </section>
  </div>

  <section class="stack" aria-labelledby="curve-heading" style="--stack-space: var(--space-s)">
    <h2 id="curve-heading">Curve</h2>

    <Curve {angles} reflectance={curve} points={{ angles: pointAngles, reflectance: points }} />
  </section>
</div>

<style>
  label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
  }

  input {
    flex: 1 1 6rem;
    min-inline-size: 0;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
  }
</style>
