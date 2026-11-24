<script lang="ts">
  import Curve from "../Curve.svelte";
  import ParamControls from "../ParamControls.svelte";
  import { angleRange, defaultParams, wavelength } from "../lib/constants";
  import { buildLayers, type Params } from "../lib/layers";
  import { steps } from "../lib/plot";
  import { reflectance } from "../lib/reflectance";
  import { pointAngles, simulate, type Simulation } from "../lib/simulate";

  let { simulation }: { simulation: Simulation } = $props();

  const angles = steps(angleRange.min, angleRange.max, angleRange.step); // degrees

  // Start from the defaults rather than the simulation's params, so there's something to fit.
  let params: Params = $state({ ...defaultParams });

  const layers = $derived(buildLayers(params));
  const curve = $derived(reflectance(layers, wavelength, angles));
  const points = $derived(simulate(simulation));
</script>

<div class="with-sidebar" style="--sidebar-width: 30rem">
  <div class="stack" style="--stack-space: var(--space-m)">
    <ParamControls bind:params />
  </div>

  <section class="stack" aria-labelledby="curve-heading" style="--stack-space: var(--space-s)">
    <h2 id="curve-heading">Curve</h2>

    <p>Move the sliders until the curve fits the data points.</p>

    <Curve {angles} reflectance={curve} points={{ angles: pointAngles, reflectance: points }} />
  </section>
</div>
