export const HOUR_MS = 60 * 60 * 1000;
export const DELAY_SLOT_MS = 6 * HOUR_MS;

export function fibonacci(n: number): number {
  let a = 0;
  let b = 1;
  if (n <= 0) return 0;
  for (let i = 1; i < n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

export function delayDuration(numberOfPriorDelays: number): number {
  if (numberOfPriorDelays < 0) throw new Error("negative delay count");
  return fibonacci(numberOfPriorDelays + 1) * DELAY_SLOT_MS;
}