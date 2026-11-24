/** Evenly spaced data points: angle i is `start + i * step`. */
export type Points = { start: number; step: number; reflectance: number[] };

const VERSION = 1;
const HEADER = 1 + 8 + 8 + 2; // version, start, step, count
const MAX = 0xffff;

/**
 * Packs points into a URL-safe base64 string. Reflectance must be in [0, 1]; it is
 * stored as 16-bit integers, so it comes back rounded to the nearest 1/65535.
 */
export function encodePoints({ start, step, reflectance }: Points): string {
  const view = new DataView(new ArrayBuffer(HEADER + 2 * reflectance.length));
  view.setUint8(0, VERSION);
  view.setFloat64(1, start);
  view.setFloat64(9, step);
  view.setUint16(17, reflectance.length);
  reflectance.forEach((r, i) => view.setUint16(HEADER + 2 * i, Math.round(r * MAX)));
  return toBase64Url(new Uint8Array(view.buffer));
}

/** The inverse of `encodePoints`; null if the string isn't a valid encoding. */
export function decodePoints(encoded: string): Points | null {
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(encoded);
  } catch {
    return null;
  }
  if (bytes.length < HEADER) return null;

  const view = new DataView(bytes.buffer);
  if (view.getUint8(0) !== VERSION) return null;
  const start = view.getFloat64(1);
  const step = view.getFloat64(9);
  const count = view.getUint16(17);
  if (bytes.length !== HEADER + 2 * count || !Number.isFinite(start) || !(step > 0)) return null;

  const reflectance = Array.from({ length: count }, (_, i) => view.getUint16(HEADER + 2 * i) / MAX);
  return { start, step, reflectance };
}

export const pointAngles = ({ start, step, reflectance }: Points): number[] =>
  reflectance.map((_, i) => start + i * step);

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const binary = atob(s.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
