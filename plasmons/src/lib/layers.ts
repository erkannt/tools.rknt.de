import { fixed } from "./constants";

export type Complex = { re: number; im: number };

export type Layer = {
  name: string;
  /** complex refractive index n + iκ */
  index: Complex;
  /** thickness in nm; Infinity for the semi-infinite outer layers */
  thickness: number;
};

/** The values the user can adjust. */
export type Params = {
  cytosolIndex: number;
  mediaThickness: number;
  goldThickness: number;
  chromiumThickness: number;
};

/** Layers in the order light passes through them: coverslip first, cytosol last. */
export function buildLayers(p: Params): Layer[] {
  return [
    { name: "coverslip", index: fixed.coverslipIndex, thickness: Infinity },
    { name: "chromium", index: fixed.chromiumIndex, thickness: p.chromiumThickness },
    { name: "gold", index: fixed.goldIndex, thickness: p.goldThickness },
    { name: "media", index: fixed.mediaIndex, thickness: p.mediaThickness },
    { name: "membrane", index: fixed.membraneIndex, thickness: fixed.membraneThickness },
    { name: "cytosol", index: { re: p.cytosolIndex, im: 0 }, thickness: Infinity },
  ];
}

export function formatIndex(n: Complex): string {
  const re = n.re.toFixed(4);
  return n.im === 0 ? re : `${re} + ${n.im.toFixed(4)}i`;
}
