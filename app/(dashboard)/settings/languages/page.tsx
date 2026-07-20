import { getSqliteConnection } from "@/server/db/client";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { LanguagesList } from "./languages-list";

export default async function LanguagesSettingsPage() {
  const { actor } = await requireFreelancerBackend();
  const service = new I18nService(getSqliteConnection().db);
  const locales = service.listLocales(actor);
  const settings = service.getSettings(actor);
  const completion = new Map(
    service.getCompletion(actor).map((item) => [item.locale, item.percent]),
  );
  const localeNames = new Map(locales.map((locale) => [locale.code, locale.nativeName]));
  const languages = locales.map((locale) => {
    const usage = service.getLocaleUsage(actor, locale.code);
    return {
      builtIn: locale.builtIn,
      code: locale.code,
      completion: completion.get(locale.code) ?? 0,
      fallbackName: locale.fallbackLocale
        ? localeNames.get(locale.fallbackLocale) ?? locale.fallbackLocale
        : null,
      name: locale.name,
      nativeName: locale.nativeName,
      status: locale.status,
      usage: usage.userPreferences + usage.clients + usage.portalInvitations,
    };
  });

  return (
    <LanguagesList
      initialDefaultLocale={settings.defaultLocale}
      languages={languages}
    />
  );
}
