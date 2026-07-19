import { enCatalog } from "../../locales/en";
import { trCatalog } from "../../locales/tr";
import type { I18nNamespace, TranslationCatalog } from "./types";

export const DEFAULT_LOCALE = "tr";
export const BUILT_IN_LOCALES = ["tr", "en"] as const;

export const BUILT_IN_CATALOGS: Record<string, TranslationCatalog> = {
  tr: trCatalog,
  en: enCatalog,
};

export function getBuiltInCatalog(locale: string): TranslationCatalog | null {
  return BUILT_IN_CATALOGS[locale] ?? null;
}

export function pickNamespaces(
  catalog: TranslationCatalog,
  namespaces: readonly I18nNamespace[],
): Partial<TranslationCatalog> {
  return Object.fromEntries(
    namespaces.map((namespace) => [namespace, catalog[namespace] ?? {}]),
  ) as Partial<TranslationCatalog>;
}

export function flattenCatalog(
  catalog: Partial<TranslationCatalog>,
  namespaces: readonly I18nNamespace[],
): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const namespace of namespaces) {
    const namespaceCatalog = catalog[namespace] ?? {};
    for (const [key, value] of Object.entries(namespaceCatalog)) {
      entries[`${namespace}.${key}`] = value;
    }
  }

  return entries;
}

export function compareCatalogKeys(
  left: TranslationCatalog,
  right: TranslationCatalog,
  namespaces: readonly I18nNamespace[],
): { missingInLeft: string[]; missingInRight: string[] } {
  const leftKeys = new Set(Object.keys(flattenCatalog(left, namespaces)));
  const rightKeys = new Set(Object.keys(flattenCatalog(right, namespaces)));
  return {
    missingInLeft: [...rightKeys].filter((key) => !leftKeys.has(key)).sort(),
    missingInRight: [...leftKeys].filter((key) => !rightKeys.has(key)).sort(),
  };
}
