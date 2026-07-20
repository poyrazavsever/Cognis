import { getSqliteConnection } from "@/server/db/client";
import { I18nService } from "@/server/i18n/service";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getUserPreferences } from "@/server/settings/preferences";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { LanguagePreferenceForm } from "./language-preference-form";

export default async function LanguagePreferenceSettingsPage() {
  const { actor, context } = await requireFreelancerBackend();
  const i18n = new I18nService(getSqliteConnection().db);
  const activeLocales = i18n
    .listLocales(actor)
    .filter((locale) => locale.status === "active")
    .map(({ code, name, nativeName }) => ({ code, name, nativeName }));
  const defaultLocale = i18n.getSettings(actor).defaultLocale;
  const preferredLanguage = getUserPreferences(actor).language;
  const resolved = await resolveFreelancerLocale(context);
  const preferenceIsActive = activeLocales.some(
    (locale) => locale.code === preferredLanguage,
  );

  return (
    <LanguagePreferenceForm
      activeLocales={activeLocales}
      defaultLocale={defaultLocale}
      initialLanguage={preferenceIsActive ? preferredLanguage : resolved.locale}
      preferenceNeedsSelection={!preferenceIsActive}
    />
  );
}
