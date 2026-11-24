import { normal } from "./random";

/**
 * Adds Gaussian noise with standard deviation `sd` to each value and clamps the result to [0, 1].
 * The same seed gives the same noise pattern, so the points only move with the curve.
 */
export function addNoise(values: number[], sd: number, seed: number): number[] {
  const next = normal(seed);
  return values.map((v) => Math.min(1, Math.max(0, v + sd * next())));
}
