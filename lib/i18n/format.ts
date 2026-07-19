import type { TranslationValues } from "./types";

const PLURAL_PATTERN = /\{(\w+),\s*plural,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}\s*\}/g;
const VALUE_PATTERN = /\{(\w+)\}/g;

export function interpolateMessage(
  message: string,
  values: TranslationValues = {},
  locale = "tr",
): string {
  const pluralized = message.replace(
    PLURAL_PATTERN,
    (_match, key: string, one: string, other: string) => {
      const count = Number(values[key] ?? 0);
      const category = new Intl.PluralRules(toIntlLocale(locale)).select(count);
      const template = category === "one" ? one : other;
      return template.replaceAll("#", String(count));
    },
  );

  return pluralized.replace(VALUE_PATTERN, (_match, key: string) => {
    const value = values[key];
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return formatDate(value, locale);
    return String(value);
  });
}

export function formatDate(
  value: Date | string | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(new Date(value));
}

export function formatDateTime(
  value: Date | string | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(new Date(value));
}

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(toIntlLocale(locale), options).format(value);
}

export function formatMoney(
  amountMinor: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

export function toIntlLocale(locale: string): string {
  return locale === "tr" ? "tr-TR" : locale === "en" ? "en-US" : locale;
}
