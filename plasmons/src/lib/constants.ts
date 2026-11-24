import type { Params } from "./layers";

// scripts/fixtures.py keeps its own copy of these values; fixtures.test.ts checks they agree.

/** He-Ne laser, in nm. Fixed because the metal indices below were measured at this wavelength. */
export const wavelength = 632.8;

/** Angles of incidence in degrees, up to the NA 1.7 objective limit in the 1.788 coverslip: asin(1.7 / 1.788) ≈ 72° */
export const angleRange = { min: 30, max: 72, step: 0.1 };

export const fixed = {
  coverslipIndex: { re: 1.788, im: 0 },
  chromiumIndex: { re: 3.3, im: 4.2731 },
  goldIndex: { re: 0.1943, im: 3.5921 },
  mediaIndex: { re: 1.335, im: 0 },
  membraneIndex: { re: 1.5, im: 0 },
  membraneThickness: 8,
} as const;

export const defaultParams: Params = {
  cytosolIndex: 1.37,
  mediaThickness: 50,
  goldThickness: 47,
  chromiumThickness: 3,
};

/** Slider bounds for each adjustable value. */
export const paramRanges: Record<keyof Params, { min: number; max: number; step: number }> = {
  cytosolIndex: { min: 1.34, max: 1.4, step: 0.001 },
  mediaThickness: { min: 0, max: 150, step: 1 },
  goldThickness: { min: 38, max: 55, step: 0.5 },
  chromiumThickness: { min: 2, max: 5, step: 0.1 },
};

/** Standard deviation of the Gaussian noise added to simulated reflectance. */
export const noiseRange = { min: 0, max: 0.05, step: 0.001 };
export const defaultNoise = 0.01;

/** Spacing in degrees of the simulated data points; coarser than the curve to keep links short. */
export const pointSpacing = 0.2;
