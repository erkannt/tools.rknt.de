<script lang="ts">
  import Curve from "../Curve.svelte";
  import ParamControls from "../ParamControls.svelte";
  import { angleRange, defaultParams, wavelength } from "../lib/constants";
  import { buildLayers, type Params } from "../lib/layers";
  import { steps } from "../lib/plot";
  import { reflectance } from "../lib/reflectance";

  const angles = steps(angleRange.min, angleRange.max, angleRange.step); // degrees

  let params: Params = $state({ ...defaultParams });

  const layers = $derived(buildLayers(params));
  const curve = $derived(reflectance(layers, wavelength, angles));
</script>

<div class="with-sidebar" style="--sidebar-width: 30rem">
  <div class="stack" style="--stack-space: var(--space-m)">
    <ParamControls bind:params />
  </div>

  <section class="stack" aria-labelledby="curve-heading" style="--stack-space: var(--space-s)">
    <h2 id="curve-heading">Curve</h2>

    <Curve {angles} reflectance={curve} />
  </section>
</div>
