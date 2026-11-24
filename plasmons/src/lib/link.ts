import type { Params } from "./layers";
import type { Simulation } from "./simulate";

const VERSION = 2;
// Fixed order, so the encoding doesn't depend on object key order.
const PARAM_KEYS: (keyof Params)[] = ["cytosolIndex", "mediaThickness", "goldThickness", "chromiumThickness"];
const LENGTH = 1 + 4 + 8 + 8 * PARAM_KEYS.length; // version, seed, noise, params

/** Packs a simulation into a short URL-safe base64 string. */
export function encodeSimulation({ params, noise, seed }: Simulation): string {
  const view = new DataView(new ArrayBuffer(LENGTH));
  view.setUint8(0, VERSION);
  view.setUint32(1, seed);
  view.setFloat64(5, noise);
  PARAM_KEYS.forEach((key, i) => view.setFloat64(13 + 8 * i, params[key]));
  return toBase64Url(new Uint8Array(view.buffer));
}

/** The inverse of `encodeSimulation`; null if the string isn't a valid encoding. */
export function decodeSimulation(encoded: string): Simulation | null {
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(encoded);
  } catch {
    return null;
  }
  if (bytes.length !== LENGTH) return null;

  const view = new DataView(bytes.buffer);
  if (view.getUint8(0) !== VERSION) return null;
  const seed = view.getUint32(1);
  const noise = view.getFloat64(5);
  const values = PARAM_KEYS.map((_, i) => view.getFloat64(13 + 8 * i));
  if (!(noise >= 0) || !values.every(Number.isFinite)) return null;

  const params = Object.fromEntries(PARAM_KEYS.map((key, i) => [key, values[i]])) as Params;
  return { params, noise, seed };
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const binary = atob(s.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
