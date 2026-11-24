export type Domain = [number, number];
export type Range = [number, number];
export type Tick = { value: number; position: number };

/** Maps a value from `domain` linearly onto `range`. */
export function linearScale([d0, d1]: Domain, [r0, r1]: Range) {
  return (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

/** Evenly spaced values from `start` to `end` inclusive. */
export function steps(start: number, end: number, step: number): number[] {
  const count = Math.round((end - start) / step);
  return Array.from({ length: count + 1 }, (_, i) => start + i * step);
}

/** SVG path `d` attribute for a polyline through the given points. */
export function linePath(xs: number[], ys: number[]): string {
  return xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ys[i].toFixed(2)}`)
    .join(" ");
}

export function ticks(
  values: number[],
  scale: (v: number) => number,
): Tick[] {
  return values.map((value) => ({ value, position: scale(value) }));
}

/** SVG path `d` attribute drawing an ✕ of half-width `size` at each point. */
export function crossesPath(xs: number[], ys: number[], size: number): string {
  return xs
    .map((x, i) => {
      const [x0, x1, y0, y1] = [x - size, x + size, ys[i] - size, ys[i] + size].map((v) => v.toFixed(2));
      return `M ${x0} ${y0} L ${x1} ${y1} M ${x0} ${y1} L ${x1} ${y0}`;
    })
    .join(" ");
}
