declare module 'wcag-contrast' {
  export function hex(color1: string, color2: string): number;
  export function rgb(color1: [number, number, number], color2: [number, number, number]): number;
  export function score(contrast: number): 'AAA' | 'AA' | 'AA Large' | 'F';
  export function luminance(a: number, b: number): number;
}
