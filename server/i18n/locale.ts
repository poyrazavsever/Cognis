import type { TextDirection } from "../../lib/i18n";

export const LOCALE_COOKIE = "neta_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const DEFAULT_TEXT_DIRECTION: TextDirection = "ltr";

export function normalizeLocaleCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return /^[a-z]{2}(?:-[A-Z]{2}[0-9]?)?$/.test(normalized) ? normalized : null;
}

export function directionForLocale(locale: string, explicit?: TextDirection | null): TextDirection {
  if (explicit) return explicit;
  return /^(ar|fa|he|ur)(-|$)/.test(locale) ? "rtl" : DEFAULT_TEXT_DIRECTION;
}

export function buildLocaleCookie(value: string) {
  return {
    name: LOCALE_COOKIE,
    value,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  };
}
