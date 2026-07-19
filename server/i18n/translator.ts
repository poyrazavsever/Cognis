import {
  createTranslatorFromMessages,
  type I18nNamespace,
  type TranslationValues,
} from "../../lib/i18n";
import { getCatalogVersion, getResolvedCatalog } from "./catalog";

export type ServerTranslator = {
  locale: string;
  fallbackChain: string[];
  messages: Record<string, string>;
  t: (key: string, values?: TranslationValues) => string;
};

export function createTranslator(
  locale: string,
  namespaces: readonly I18nNamespace[],
): ServerTranslator {
  const catalog = getResolvedCatalog(locale, namespaces, getCatalogVersion());
  const translator = createTranslatorFromMessages(catalog.locale, catalog.messages);

  return {
    locale: catalog.locale,
    fallbackChain: catalog.fallbackChain,
    messages: catalog.messages,
    t(key, values) {
      const value = translator.t(key, values);
      if (value === key && process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] Missing translation key "${key}" for locale "${catalog.locale}".`);
      }
      return value;
    },
  };
}

export function getClientI18nPayload(locale: string, namespaces: readonly I18nNamespace[]) {
  const catalog = getResolvedCatalog(locale, namespaces, getCatalogVersion());
  return {
    locale: catalog.locale,
    messages: catalog.messages,
  };
}
