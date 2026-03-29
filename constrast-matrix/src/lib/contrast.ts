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

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');

  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16)
    };
  }

  if (cleanHex.length === 6) {
    return {
      r: parseInt(cleanHex.slice(0, 2), 16),
      g: parseInt(cleanHex.slice(2, 4), 16),
      b: parseInt(cleanHex.slice(4, 6), 16)
    };
  }

  return null;
}

function parseRgb(input: string): { r: number; g: number; b: number } | null {
  const match = input.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return null;
}

export function parseColor(input: string): { r: number; g: number; b: number } | null {
  const trimmed = input.trim().toLowerCase();

  if (trimmed.startsWith('#')) {
    return parseHex(trimmed);
  }

  if (trimmed.startsWith('rgb')) {
    return parseRgb(trimmed);
  }

  return parseHex(trimmed);
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
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

export function categorizePairs(pairs: ColorPair[]): WcagCategory[] {
  return [
    {
      name: 'AAA Normal',
      pairs: pairs.filter(p => p.ratio >= 7)
    },
    {
      name: 'AA Normal',
      pairs: pairs.filter(p => p.ratio >= 4.5 && p.ratio < 7)
    },
    {
      name: 'AAA Large',
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
}

export function generateUtilityClass(pair: ColorPair, category: string): string {
  const className = `${pair.foreground.name}-on-${pair.background.name}-${category.split(' ')[0]}`;
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
