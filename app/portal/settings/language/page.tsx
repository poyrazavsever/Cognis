import { eq } from "drizzle-orm";
import { getSqliteConnection } from "@/server/db/client";
import {
  clients,
  instanceI18nSettings,
  instanceLocales,
} from "@/server/db/schema";
import { resolvePortalLocale } from "@/server/i18n/resolver";
import { getUserPreferences } from "@/server/settings/preferences";
import { requirePortalBackend } from "@/server/web/portal";
import { PortalLanguagePreferenceForm } from "./portal-language-preference-form";

export default async function PortalLanguageSettingsPage() {
  const { actor, context } = await requirePortalBackend();
  const { db } = getSqliteConnection();
  const activeLocales = db
    .select({
      code: instanceLocales.code,
      name: instanceLocales.name,
      nativeName: instanceLocales.nativeName,
    })
    .from(instanceLocales)
    .where(eq(instanceLocales.status, "active"))
    .all();
  const defaultLocale = db
    .select({ defaultLocale: instanceI18nSettings.defaultLocale })
    .from(instanceI18nSettings)
    .where(eq(instanceI18nSettings.key, "default"))
    .get()?.defaultLocale ?? "tr";
  const rawAssignedLanguage = context.profile.clientId
    ? db
      .select({ portalLocale: clients.portalLocale })
      .from(clients)
      .where(eq(clients.id, context.profile.clientId))
      .get()?.portalLocale ?? defaultLocale
    : defaultLocale;
  const assignedLanguage = activeLocales.some((locale) => locale.code === rawAssignedLanguage)
    ? rawAssignedLanguage
    : defaultLocale;
  const preferredLanguage = getUserPreferences(actor).language;
  const resolved = await resolvePortalLocale(context);
  const preferenceIsActive = activeLocales.some(
    (locale) => locale.code === preferredLanguage,
  );

  return (
    <PortalLanguagePreferenceForm
      activeLocales={activeLocales}
      assignedLanguage={assignedLanguage}
      initialLanguage={preferenceIsActive ? preferredLanguage : resolved.locale}
      preferenceNeedsSelection={!preferenceIsActive}
    />
  );
}
