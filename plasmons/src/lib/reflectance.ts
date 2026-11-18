import type { Layer } from "./layers";

/**
 * Reflectance (0–1) of the layer stack for each angle of incidence.
 *
 * STUB: returns a made-up resonance dip that moves with the layer values so
 * the UI can be wired up. Replace with the real multilayer calculation.
 *
 * @param layers ordered from the incident medium (coverslip) outwards
 * @param wavelength vacuum wavelength in nm
 * @param angles angles of incidence in degrees
 */
export function reflectance(
  layers: Layer[],
  _wavelength: number,
  angles: number[],
): number[] {
  const finiteThickness = layers
    .filter((l) => Number.isFinite(l.thickness))
    .reduce((sum, l) => sum + l.thickness, 0);
  const outer = layers[layers.length - 1].index.re;

  const centre = 55 + (outer - 1.34) * 150 + finiteThickness * 0.03;
  const width = 1 + finiteThickness * 0.01;
  const depth = 0.9;

  return angles.map((a) => {
    const x = (a - centre) / width;
    return 1 - depth / (1 + x * x);
  });
}
