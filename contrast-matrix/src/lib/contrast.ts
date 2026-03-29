import * as contrast from 'wcag-contrast';

export interface ParsedColor {
  name: string;
  value: string;
}

export interface ColorPair {
  foreground: ParsedColor;
  background: ParsedColor;
  ratio: number;
}

export interface WcagCategory {
  name: string;
  pairs: ColorPair[];
}

export function parseCssVariables(input: string): ParsedColor[] {
  const regex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  const colors: ParsedColor[] = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    colors.push({
      name: match[1],
      value: match[2].trim()
    });
  }

  return colors;
}

export function getContrastRatio(color1: string, color2: string): number {
  try {
    return contrast.hex(color1, color2);
  } catch {
    return 0;
  }
}

export function generateCombinations(colors: ParsedColor[]): ColorPair[] {
  const pairs: ColorPair[] = [];

  for (const fg of colors) {
    for (const bg of colors) {
      if (fg.name === bg.name) continue;

      const ratio = getContrastRatio(fg.value, bg.value);
      pairs.push({ foreground: fg, background: bg, ratio });
    }
  }

  return pairs;
}

export function sortPairsByBackgroundOrder(pairs: ColorPair[], colors: ParsedColor[]): ColorPair[] {
  const colorOrder = new Map(colors.map((c, i) => [c.name, i]));
  return [...pairs].sort((a, b) => {
    const aBg = colorOrder.get(a.background.name) ?? Infinity;
    const bBg = colorOrder.get(b.background.name) ?? Infinity;
    if (aBg !== bBg) return aBg - bBg;
    const aFg = colorOrder.get(a.foreground.name) ?? Infinity;
    const bFg = colorOrder.get(b.foreground.name) ?? Infinity;
    return aFg - bFg;
  });
}

export function categorizePairs(pairs: ColorPair[], colors?: ParsedColor[]): WcagCategory[] {
  const categories: WcagCategory[] = [
    {
      name: 'AAA Normal',
      pairs: pairs.filter(p => p.ratio >= 7)
    },
    {
      name: 'AA Normal / AAA Large',
      pairs: pairs.filter(p => p.ratio >= 4.5 && p.ratio < 7)
    },
    {
      name: 'AA Large',
      pairs: pairs.filter(p => p.ratio >= 3 && p.ratio < 4.5)
    },
    {
      name: 'Insufficient Contrast',
      pairs: pairs.filter(p => p.ratio < 3)
    }
  ].filter(cat => cat.pairs.length > 0);

  if (colors) {
    for (const cat of categories) {
      cat.pairs = sortPairsByBackgroundOrder(cat.pairs, colors);
    }
  }

  return categories;
}

export function generateUtilityClass(pair: ColorPair, category: string): string {
  const suffix = category.replace(/ /g, '-');
  const className = `${pair.foreground.name}-on-${pair.background.name}-${suffix}`;
  return `.${className} {
  color: var(--${pair.foreground.name});
  background-color: var(--${pair.background.name});
}`;
}

export function generateUtilityClassesForCategory(category: WcagCategory): string {
  return category.pairs
    .map(p => generateUtilityClass(p, category.name))
    .join('\n\n');
}
