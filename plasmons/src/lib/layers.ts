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

export const defaultParams: Params = {
  cytosolIndex: 1.37,
  mediaThickness: 50,
  goldThickness: 47,
  chromiumThickness: 3,
};

export const fixed = {
  coverslipIndex: { re: 1.788, im: 0 },
  chromiumIndex: { re: 3.3, im: 4.2731 },
  goldIndex: { re: 0.1943, im: 3.5921 },
  mediaIndex: { re: 1.335, im: 0 },
  membraneIndex: { re: 1.5, im: 0 },
  membraneThickness: 8,
} as const;

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
