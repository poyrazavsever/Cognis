export const colorModes = ["light", "dark", "system"] as const;

export type ColorMode = (typeof colorModes)[number];

export const COLOR_MODE_COOKIE = "neta-color-mode";
export const COLOR_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isColorMode(value: unknown): value is ColorMode {
  return typeof value === "string" && colorModes.includes(value as ColorMode);
}
