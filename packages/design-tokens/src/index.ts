export type ColorMode = 'light' | 'dark' | 'system';
export type ResolvedColorMode = Exclude<ColorMode, 'system'>;

export type BrandColorInput = {
  primary?: string | null;
  accent?: string | null;
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfacePressed: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  borderStrong: string;
  danger: string;
  dangerSurface: string;
  info: string;
  infoSurface: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  overlay: string;
  focusRing: string;
};

export type ThemeTokens = {
  colors: ThemeColors;
  mode: ResolvedColorMode;
  radius: typeof radius;
  shadow: typeof shadow;
  spacing: typeof spacing;
  typography: typeof typography;
};

type Rgb = {
  r: number;
  g: number;
  b: number;
};

const WHITE = '#FFFFFF';
const BLACK = '#000000';
const INK = '#1D1112';

export const brand = {
  red: '#EC2027',
  redAccessible: '#D51D24',
  redDeep: '#B7131A',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 56,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#1D1112',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  floating: {
    shadowColor: '#1D1112',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 8,
  },
  navigation: {
    shadowColor: '#1D1112',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

export const lightColors: ThemeColors = {
  background: '#FFF8F8',
  surface: WHITE,
  surfaceElevated: WHITE,
  surfaceMuted: '#FCECED',
  surfacePressed: '#F7DEDF',
  text: INK,
  textMuted: '#6E5557',
  textSubtle: '#8E7476',
  primary: brand.redAccessible,
  primaryPressed: brand.redDeep,
  primaryForeground: WHITE,
  accent: '#642024',
  accentForeground: WHITE,
  border: '#EAD7D8',
  borderStrong: '#D9BFC1',
  danger: '#B7131A',
  dangerSurface: '#FDE8E9',
  info: '#315DA8',
  infoSurface: '#EAF1FC',
  success: '#187A48',
  successSurface: '#E5F5EC',
  warning: '#9A5B00',
  warningSurface: '#FFF2DA',
  overlay: 'rgba(29, 17, 18, 0.52)',
  focusRing: '#246BFE',
};

export const darkColors: ThemeColors = {
  background: '#12090A',
  surface: '#1D1112',
  surfaceElevated: '#261719',
  surfaceMuted: '#2A1719',
  surfacePressed: '#382023',
  text: '#FFF7F7',
  textMuted: '#C7AFB1',
  textSubtle: '#A88F92',
  primary: '#FF525A',
  primaryPressed: '#FF747B',
  primaryForeground: '#240507',
  accent: '#FFD7DA',
  accentForeground: '#240507',
  border: '#43272A',
  borderStrong: '#644044',
  danger: '#FF737A',
  dangerSurface: '#41171A',
  info: '#8DB7FF',
  infoSurface: '#142746',
  success: '#6EE7A8',
  successSurface: '#123624',
  warning: '#FFD27A',
  warningSurface: '#3D2A0B',
  overlay: 'rgba(0, 0, 0, 0.68)',
  focusRing: '#8DB7FF',
};

export function createThemeTokens(
  mode: ResolvedColorMode,
  brandColors: BrandColorInput = {},
): ThemeTokens {
  const base = mode === 'dark' ? darkColors : lightColors;
  const primary = normalizeHex(brandColors.primary) ?? base.primary;
  const accent = normalizeHex(brandColors.accent) ?? base.accent;

  return {
    colors: {
      ...base,
      primary,
      primaryPressed: mix(primary, mode === 'dark' ? WHITE : BLACK, mode === 'dark' ? 0.18 : 0.16),
      primaryForeground: readableForeground(primary),
      accent,
      accentForeground: readableForeground(accent),
    },
    mode,
    radius,
    shadow,
    spacing,
    typography,
  };
}

export function normalizeHex(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const shorthand = /^#?([0-9a-fA-F]{3})$/.exec(trimmed);
  const full = /^#?([0-9a-fA-F]{6})$/.exec(trimmed);

  const shorthandValue = shorthand?.[1];
  const fullValue = full?.[1];

  if (shorthandValue) {
    return `#${shorthandValue
      .split('')
      .map((character) => `${character}${character}`)
      .join('')
      .toUpperCase()}`;
  }

  if (fullValue) {
    return `#${fullValue.toUpperCase()}`;
  }

  return null;
}

export function contrastRatio(first: string, second: string): number {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);

  if (!firstRgb || !secondRgb) {
    return 1;
  }

  const firstLuminance = relativeLuminance(firstRgb);
  const secondLuminance = relativeLuminance(secondRgb);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function readableForeground(background: string): string {
  return contrastRatio(background, WHITE) >= contrastRatio(background, BLACK) ? WHITE : BLACK;
}

function mix(color: string, target: string, amount: number): string {
  const sourceRgb = hexToRgb(color);
  const targetRgb = hexToRgb(target);

  if (!sourceRgb || !targetRgb) {
    return color;
  }

  return rgbToHex({
    r: sourceRgb.r + (targetRgb.r - sourceRgb.r) * amount,
    g: sourceRgb.g + (targetRgb.g - sourceRgb.g) * amount,
    b: sourceRgb.b + (targetRgb.b - sourceRgb.b) * amount,
  });
}

function hexToRgb(value: string): Rgb | null {
  const normalized = normalizeHex(value);

  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(value: Rgb): string {
  const channel = (number: number) =>
    Math.round(Math.min(255, Math.max(0, number)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

  return `#${channel(value.r)}${channel(value.g)}${channel(value.b)}`;
}

function luminanceChannel(channel: number): number {
    const value = channel / 255;

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const red = luminanceChannel(r);
  const green = luminanceChannel(g);
  const blue = luminanceChannel(b);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
