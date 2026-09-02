import { getSqliteConnection } from "../db/client";
import { createI18nRepository } from "../repositories/i18n";

export function getPublicLocalizationMetadata() {
  const repository = createI18nRepository(getSqliteConnection().db);
  repository.createSettingsIfMissing();
  const settings = repository.getSettings();
  const locales = repository.listLocales().filter((locale) => locale.status !== "archived");

  return {
    defaultLocale: settings?.defaultLocale ?? "tr",
    supportedLocales: locales.map((locale) => ({
      code: locale.code,
      name: locale.name,
      nativeName: locale.nativeName,
      status: locale.status,
      fallbackLocale: locale.fallbackLocale,
      textDirection: locale.textDirection,
      builtIn: locale.builtIn,
    })),
    fallbacks: Object.fromEntries(
      locales
        .filter((locale) => locale.fallbackLocale)
        .map((locale) => [locale.code, locale.fallbackLocale]),
    ),
    catalogVersion: settings?.catalogVersion ?? 1,
  };
}
