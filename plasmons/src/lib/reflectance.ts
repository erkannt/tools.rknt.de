import { abs2, add, complex, div, expi, mul, neg, sqrt, sub } from "./complex";
import type { Complex, Layer } from "./layers";

type Matrix = [[Complex, Complex], [Complex, Complex]];

const ONE = complex(1);

/**
 * Reflectance (0–1) of the layer stack for p-polarised light at each angle of incidence.
 * Complex indices use the n + ik convention (k > 0 absorbs).
 *
 * Coherent transfer-matrix method, following the conventions of tmm
 * (S. J. Byrnes, "Multilayer optical calculations", arXiv:1603.02720).
 *
 * @param layers ordered from the incident medium (coverslip) outwards; the
 *   first and last layers are semi-infinite and the first must be lossless
 * @param wavelength vacuum wavelength in nm
 * @param angles angles of incidence in degrees
 */
export function reflectance(layers: Layer[], wavelength: number, angles: number[]): number[] {
  return angles.map((angle) => reflectanceAt(layers, wavelength, (angle * Math.PI) / 180));
}

function reflectanceAt(layers: Layer[], wavelength: number, theta0: number): number {
  const n = layers.map((l) => l.index);
  // Snell's law: n_i sin θ_i is the same in every layer.
  const nSin0 = mul(n[0], complex(Math.sin(theta0)));
  const cos = n.map((ni) => forwardCos(ni, div(nSin0, ni)));

  // p-polarised Fresnel reflection coefficient at the interface between layers i and i + 1.
  const r = (i: number): Complex => {
    const a = mul(n[i + 1], cos[i]);
    const b = mul(n[i], cos[i + 1]);
    return div(sub(a, b), add(a, b));
  };

  // Transmission coefficients only scale the matrix and cancel in the ratio below, so they are left out.
  let m = interfaceMatrix(r(0));
  for (let i = 1; i < layers.length - 1; i++) {
    // phase picked up crossing layer i
    const delta = mul(complex((2 * Math.PI * layers[i].thickness) / wavelength), mul(n[i], cos[i]));
    const propagate: Matrix = [
      [expi(neg(delta)), complex(0)],
      [complex(0), expi(delta)],
    ];
    m = multiply(m, multiply(propagate, interfaceMatrix(r(i))));
  }

  return abs2(div(m[1][0], m[0][0]));
}

const interfaceMatrix = (r: Complex): Matrix => [
  [ONE, r],
  [r, ONE],
];

/**
 * cos θ from sin θ, choosing the root for the forward-travelling wave: one that
 * decays into the layer (Im(n cos θ) > 0) or, when lossless, propagates into it.
 */
function forwardCos(n: Complex, sin: Complex): Complex {
  const cos = sqrt(sub(ONE, mul(sin, sin)));
  const nCos = mul(n, cos);
  const forward = Math.abs(nCos.im) > 100 * Number.EPSILON ? nCos.im > 0 : nCos.re > 0;
  return forward ? cos : neg(cos);
}

function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    [add(mul(a[0][0], b[0][0]), mul(a[0][1], b[1][0])), add(mul(a[0][0], b[0][1]), mul(a[0][1], b[1][1]))],
    [add(mul(a[1][0], b[0][0]), mul(a[1][1], b[1][0])), add(mul(a[1][0], b[0][1]), mul(a[1][1], b[1][1]))],
  ];
}
