function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const bigint = parseInt(full, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' + [r, g, b].map((x) => {
      const s = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return s.length === 1 ? '0' + s : s;
    }).join('')
  );
}

function mix(hexA: string, hexB: string, weightB: number) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const wA = 1 - weightB;
  return rgbToHex(a.r * wA + b.r * weightB, a.g * wA + b.g * weightB, a.b * wA + b.b * weightB);
}

function generateScale(base: string) {
  const scale: Record<number, string> = {};
  // We want primary-10 .. primary-100 with primary-50 == base.
  // Additionally include non-selectable endpoints: 0 (black) and 110 (white).
  scale[0] = '#000000';
  // 110 is reserved as near-white sentinel
  scale[110] = '#ffffff';
  // For steps 10..50 mix black -> base; for 50..100 mix base -> white.
  for (let step = 10; step <= 100; step += 10) {
    if (step <= 50) {
      // progress 0 at 10, 1 at 50
      const t = (step - 10) / (50 - 10);
      scale[step] = mix('#000000', base, t);
    } else {
      // progress 0 at 50, 1 at 100
      const t = (step - 50) / (100 - 50);
      scale[step] = mix(base, '#ffffff', t);
    }
  }
  return scale;
}

const PRIMARY = '#4f8ca9';
const SECONDARY = '#0f5a75';
const TERTIARY = '#f0972d';

const primaryScale = generateScale(PRIMARY);
const secondaryScale = generateScale(SECONDARY);
const tertiaryScale = generateScale(TERTIARY);

// Export flattened constants for easy TypeScript imports
export const primary = PRIMARY;
export const secondary = SECONDARY;
export const tertiary = TERTIARY;

export type Theme = {
  primary: string;
  secondary: string;
  tertiary: string;
};

const theme = {
  primary,
  secondary,
  tertiary,
  primaryScale,
  secondaryScale,
  tertiaryScale,
};

export default theme;
