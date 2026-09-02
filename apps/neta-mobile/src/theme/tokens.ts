import {
  brand as sharedBrand,
  contrastRatio as sharedContrastRatio,
  createThemeTokens as sharedCreateThemeTokens,
  darkColors as sharedDarkColors,
  lightColors as sharedLightColors,
  normalizeHex as sharedNormalizeHex,
  radius as sharedRadius,
  shadow as sharedShadow,
  spacing as sharedSpacing,
  typography as sharedTypography,
  type BrandColorInput,
  type ColorMode,
  type ResolvedColorMode,
  type ThemeColors,
  type ThemeTokens,
} from '@neta/design-tokens';

export type {
  BrandColorInput,
  ColorMode,
  ResolvedColorMode,
  ThemeColors,
  ThemeTokens,
};

export const brand = sharedBrand;
export const contrastRatio = sharedContrastRatio;
export const createThemeTokens = sharedCreateThemeTokens;
export const darkColors = sharedDarkColors;
export const lightColors = sharedLightColors;
export const normalizeHex = sharedNormalizeHex;
export const radius = sharedRadius;
export const shadow = sharedShadow;
export const spacing = sharedSpacing;
export const typography = sharedTypography;
