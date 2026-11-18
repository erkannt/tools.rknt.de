import type { Complex } from "./layers";

export const complex = (re: number, im = 0): Complex => ({ re, im });

export const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });

export const sub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });

export const mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const div = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d,
  };
};

export const neg = (a: Complex): Complex => ({ re: -a.re, im: -a.im });

export const abs2 = (a: Complex): number => a.re * a.re + a.im * a.im;

/** Principal square root (branch cut along the negative real axis). */
export const sqrt = (a: Complex): Complex => {
  const r = Math.hypot(a.re, a.im);
  const re = Math.sqrt((r + a.re) / 2);
  const im = Math.sqrt((r - a.re) / 2);
  return { re, im: a.im < 0 ? -im : im };
};

/** e^(i·z) */
export const expi = (z: Complex): Complex => {
  const m = Math.exp(-z.im);
  return { re: m * Math.cos(z.re), im: m * Math.sin(z.re) };
};
