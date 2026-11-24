/** Seeded uniform random numbers in [0, 1) (mulberry32). */
export function uniform(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

/** Seeded standard normal random numbers (Box–Muller). */
export function normal(seed: number): () => number {
  const u = uniform(seed);
  return () => {
    const u1 = 1 - u(); // (0, 1], so the log is finite
    const u2 = u();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}

/** A fresh seed for a new noise pattern. */
export const randomSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0];
