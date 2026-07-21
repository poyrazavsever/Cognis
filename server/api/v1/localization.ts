import "server-only";

import type { getPublicLocalizationMetadata } from "@/server/i18n/runtime";
import { normalizeLocaleCode } from "@/server/i18n/locale";
import { DomainError } from "@/server/domain/errors";

export const UNSUPPORTED_LOCALE_CODE = "UNSUPPORTED_LOCALE" as const;

export type ApiLocalizationMetadata = ReturnType<typeof getPublicLocalizationMetadata>;

export type LocaleNegotiationSource =
  | "query"
  | "accept-language"
  | "preference"
  | "portal"
  | "instance";

export type LocaleNegotiationInput = {
  metadata: ApiLocalizationMetadata;
  requestedLocale?: string | null;
  acceptLanguage?: string | null;
  preferredLocale?: string | null;
  portalLocale?: string | null;
};

export type LocaleNegotiationResult = {
  locale: string;
  requestedLocale: string | null;
  defaultLocale: string;
  source: LocaleNegotiationSource;
  fallbackChain: string[];
};

export function parseAcceptLanguage(value: string | null | undefined): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((part, index) => {
      const [rawLocale, ...params] = part.trim().split(";");
      const qValue = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="))
        ?.slice(2);
      const q = qValue ? Number.parseFloat(qValue) : 1;

      return {
        locale: normalizeLocaleCode(rawLocale),
        q: Number.isFinite(q) ? q : 0,
        index,
      };
    })
    .filter((item): item is { locale: string; q: number; index: number } => Boolean(item.locale) && item.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((item) => item.locale);
}

export function negotiateLocale(input: LocaleNegotiationInput): LocaleNegotiationResult {
  const activeLocales = new Set(
    input.metadata.supportedLocales
      .filter((locale) => locale.status === "active")
      .map((locale) => locale.code),
  );
  const defaultLocale = activeLocales.has(input.metadata.defaultLocale)
    ? input.metadata.defaultLocale
    : input.metadata.supportedLocales.find((locale) => locale.status === "active")?.code ?? input.metadata.defaultLocale;

  const candidates: Array<{ locale: string | null; source: LocaleNegotiationSource; strict: boolean }> = [
    { locale: normalizeLocaleCode(input.requestedLocale), source: "query", strict: true },
    { locale: normalizeLocaleCode(input.portalLocale), source: "portal", strict: false },
    { locale: normalizeLocaleCode(input.preferredLocale), source: "preference", strict: false },
    ...parseAcceptLanguage(input.acceptLanguage).map((locale) => ({
      locale,
      source: "accept-language" as const,
      strict: false,
    })),
    { locale: defaultLocale, source: "instance", strict: false },
  ];

  for (const candidate of candidates) {
    if (!candidate.locale) continue;
    const matched = matchSupportedLocale(candidate.locale, activeLocales);
    if (matched) {
      return {
        locale: matched,
        requestedLocale: candidate.locale,
        defaultLocale,
        source: candidate.source,
        fallbackChain: buildFallbackChain(matched, input.metadata, defaultLocale),
      };
    }

    if (candidate.strict) {
      throw new DomainError(
        UNSUPPORTED_LOCALE_CODE,
        "Unsupported locale.",
        {
          messageKey: "validation.unsupportedLocale",
          requestedLocale: candidate.locale,
          supportedLocales: [...activeLocales],
        },
      );
    }
  }

  return {
    locale: defaultLocale,
    requestedLocale: null,
    defaultLocale,
    source: "instance",
    fallbackChain: buildFallbackChain(defaultLocale, input.metadata, defaultLocale),
  };
}

export function buildLocalizationContract(metadata: ApiLocalizationMetadata) {
  return {
    ...metadata,
    negotiator: {
      queryParam: "locale",
      header: "Accept-Language",
      unsupportedLocaleCode: UNSUPPORTED_LOCALE_CODE,
      matching: "exact-or-base-language",
    },
    responseContract: {
      localizedResourceField: "localized",
      translationsField: "translations",
      fallbackChainField: "fallbackChain",
    },
  };
}

function matchSupportedLocale(locale: string, activeLocales: Set<string>): string | null {
  if (activeLocales.has(locale)) return locale;
  const base = locale.split("-")[0];
  if (base && activeLocales.has(base)) return base;
  return null;
}

function buildFallbackChain(
  locale: string,
  metadata: ApiLocalizationMetadata,
  defaultLocale: string,
): string[] {
  const chain = [locale];
  const seen = new Set(chain);
  let cursor = metadata.fallbacks[locale] ?? null;

  while (cursor && !seen.has(cursor)) {
    chain.push(cursor);
    seen.add(cursor);
    cursor = metadata.fallbacks[cursor] ?? null;
  }

  if (!seen.has(defaultLocale)) {
    chain.push(defaultLocale);
  }

  return chain;
}
