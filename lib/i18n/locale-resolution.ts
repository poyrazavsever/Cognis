export type LocaleCandidate = {
  code: string;
  status: "draft" | "active" | "archived" | "test";
  textDirection: "ltr" | "rtl";
};

export type LocaleResolutionSource =
  | "client"
  | "fallback"
  | "instance"
  | "invitation"
  | "user";

export type LocaleResolution = {
  locale: string;
  requestedLocale: string | null;
  defaultLocale: string;
  direction: "ltr" | "rtl";
  source: LocaleResolutionSource;
};

type ResolveLocalePolicyInput = {
  activeLocales: readonly LocaleCandidate[];
  defaultLocale: string | null | undefined;
  candidates: ReadonlyArray<{
    locale: string | null | undefined;
    source: Exclude<LocaleResolutionSource, "fallback" | "instance">;
  }>;
  fallbackLocale?: string;
};

export function resolveLocalePolicy(input: ResolveLocalePolicyInput): LocaleResolution {
  const fallbackLocale = input.fallbackLocale ?? "tr";
  const activeLocales = new Map(
    input.activeLocales
      .filter((locale) => locale.status === "active")
      .map((locale) => [locale.code, locale] as const),
  );
  const safeDefault = activeLocales.has(input.defaultLocale ?? "")
    ? input.defaultLocale!
    : activeLocales.has(fallbackLocale)
      ? fallbackLocale
      : activeLocales.keys().next().value ?? fallbackLocale;

  for (const candidate of input.candidates) {
    const requestedLocale = normalizeLocaleCode(candidate.locale);
    if (!requestedLocale) continue;
    const locale = activeLocales.get(requestedLocale);
    if (!locale) continue;

    return {
      locale: locale.code,
      requestedLocale,
      defaultLocale: safeDefault,
      direction: locale.textDirection,
      source: candidate.source,
    };
  }

  const defaultRecord = activeLocales.get(safeDefault);
  return {
    locale: safeDefault,
    requestedLocale: normalizeLocaleCode(input.defaultLocale),
    defaultLocale: safeDefault,
    direction: defaultRecord?.textDirection ?? directionForLocale(safeDefault),
    source: activeLocales.has(input.defaultLocale ?? "") ? "instance" : "fallback",
  };
}

export function normalizeLocaleCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return /^[a-z]{2}(?:-[A-Z]{2}[0-9]?)?$/.test(normalized) ? normalized : null;
}

export function directionForLocale(locale: string): "ltr" | "rtl" {
  return /^(ar|fa|he|ur)(-|$)/.test(locale) ? "rtl" : "ltr";
}
