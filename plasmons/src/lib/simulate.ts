import { angleRange, pointSpacing, wavelength } from "./constants";
import { buildLayers, type Params } from "./layers";
import { addNoise } from "./noise";
import { steps } from "./plot";
import { reflectance } from "./reflectance";

/** Everything needed to regenerate a set of simulated data points. */
export type Simulation = {
  params: Params;
  /** standard deviation of the Gaussian noise */
  noise: number;
  seed: number;
};

/** Angles in degrees of the simulated data points. */
export const pointAngles = steps(angleRange.min, angleRange.max, pointSpacing);

/** Noisy reflectance at each of `pointAngles`. The same simulation always gives the same points. */
export function simulate({ params, noise, seed }: Simulation): number[] {
  return addNoise(reflectance(buildLayers(params), wavelength, pointAngles), noise, seed);
}
