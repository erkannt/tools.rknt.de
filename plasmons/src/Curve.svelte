<script lang="ts">
  import { linePath, linearScale, steps, ticks } from "./lib/plot";

  let {
    angles,
    reflectance,
  }: { angles: number[]; reflectance: number[] } = $props();

  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 60, left: 70 };

  const angleDomain: [number, number] = $derived([angles[0], angles[angles.length - 1]]);

  const x = $derived(linearScale(angleDomain, [margin.left, width - margin.right]));
  const y = linearScale([0, 1], [height - margin.bottom, margin.top]);

  const xTicks = $derived(ticks(steps(angleDomain[0], angleDomain[1], 5), x));
  const yTicks = ticks(steps(0, 1, 0.2), y);

  const path = $derived(linePath(angles.map(x), reflectance.map(y)));
</script>

<svg viewBox="0 0 {width} {height}" role="img" aria-labelledby="curve-title">
  <title id="curve-title">Reflectance against angle of incidence</title>

  <g font-size="14">
    {#each xTicks as t (t.value)}
      <line x1={t.position} x2={t.position} y1={height - margin.bottom} y2={height - margin.bottom + 6} stroke="currentColor" />
      <text x={t.position} y={height - margin.bottom + 22} text-anchor="middle">{t.value}</text>
    {/each}

    {#each yTicks as t (t.value)}
      <line x1={margin.left - 6} x2={margin.left} y1={t.position} y2={t.position} stroke="currentColor" />
      <text x={margin.left - 10} y={t.position} text-anchor="end" dominant-baseline="middle">{t.value.toFixed(1)}</text>
    {/each}
  </g>

  <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="currentColor" />
  <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="currentColor" />

  <text x={(margin.left + width - margin.right) / 2} y={height - 10} text-anchor="middle" font-size="16">Angle of incidence (°)</text>
  <text x="18" y={(margin.top + height - margin.bottom) / 2} text-anchor="middle" font-size="16" transform="rotate(-90 18 {(margin.top + height - margin.bottom) / 2})">Reflectance</text>

  <path d={path} fill="none" stroke="currentColor" stroke-width="2" />
</svg>

<style>
  svg {
    inline-size: 100%;
    block-size: auto;
  }
</style>
