import { cache } from "react";
import {
  DEFAULT_LOCALE,
  flattenCatalog,
  getBuiltInCatalog,
  type I18nNamespace,
} from "../../lib/i18n";
import { getSqliteConnection } from "../db/client";
import { instanceI18nSettings } from "../db/schema";
import { createI18nRepository } from "../repositories/i18n";

export type ResolvedCatalog = {
  locale: string;
  requestedLocale: string;
  namespaces: I18nNamespace[];
  catalogVersion: number;
  fallbackChain: string[];
  messages: Record<string, string>;
};

export const getResolvedCatalog = cache(
  (
    requestedLocale: string,
    namespaces: readonly I18nNamespace[],
    catalogVersion?: number,
  ): ResolvedCatalog => {
    const { db } = getSqliteConnection();
    const repository = createI18nRepository(db);
    const version = catalogVersion ?? ensureCatalogVersion(db);
    const fallbackChain = resolveFallbackChain(repository, requestedLocale);
    const messages: Record<string, string> = {};

    for (const locale of [...fallbackChain].reverse()) {
      const builtIn = getBuiltInCatalog(locale);
      if (builtIn) {
        Object.assign(messages, flattenCatalog(builtIn, namespaces));
      }

      for (const row of repository.listUiTranslations(locale, namespaces)) {
        messages[`${row.namespace}.${row.translationKey}`] = row.value;
      }
    }

    return {
      locale: fallbackChain[0] ?? DEFAULT_LOCALE,
      requestedLocale,
      namespaces: [...namespaces],
      catalogVersion: version,
      fallbackChain,
      messages,
    };
  },
);

export function getCatalogVersion(): number {
  return ensureCatalogVersion(getSqliteConnection().db);
}

function ensureCatalogVersion(db: ReturnType<typeof getSqliteConnection>["db"]): number {
  const repository = createI18nRepository(db);
  repository.createSettingsIfMissing();
  return db.select({ catalogVersion: instanceI18nSettings.catalogVersion }).from(instanceI18nSettings).get()
    ?.catalogVersion ?? 1;
}

function resolveFallbackChain(
  repository: ReturnType<typeof createI18nRepository>,
  requestedLocale: string,
): string[] {
  const locales = new Map(repository.listLocales().map((locale) => [locale.code, locale]));
  const settings = repository.getSettings();
  const start = locales.has(requestedLocale)
    ? requestedLocale
    : settings?.defaultLocale ?? DEFAULT_LOCALE;
  const chain: string[] = [];
  const seen = new Set<string>();
  let cursor: string | null = start;

  while (cursor && !seen.has(cursor)) {
    const locale = locales.get(cursor);
    if (!locale || locale.status === "archived") break;
    chain.push(cursor);
    seen.add(cursor);
    cursor = locale.fallbackLocale;
  }

  if (!chain.includes(DEFAULT_LOCALE)) {
    chain.push(DEFAULT_LOCALE);
  }

  return chain;
}
