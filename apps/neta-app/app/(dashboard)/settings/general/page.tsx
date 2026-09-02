import { getBrandingService } from "@/server/branding/runtime";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService } from "@/server/i18n/content";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { GeneralSettingsForm } from "./general-settings-form";

export default async function GeneralSettingsPage() {
  const { actor } = await requireFreelancerBackend();
  const branding = getBrandingService().getPublic();
  const contentI18n = new ContentTranslationService(getSqliteConnection().db);
  const localization = contentI18n.getLocalizationContext(actor);
  const translations = contentI18n.listEntityTranslations("branding", "default");

  return (
    <GeneralSettingsForm
      defaultLocale={localization.defaultLocale}
      locales={localization.locales.filter((locale) => locale.status === "active")}
      initial={{
        workspaceName: branding.organizationName ?? branding.applicationName,
        metaTitle: branding.applicationName,
        shortName: branding.shortName,
        translations: toLocalizedValues(translations),
      }}
    />
  );
}

function toLocalizedValues(
  rows: Array<{ locale: string; field: string; value: string }>,
) {
  return rows.reduce<Record<string, Record<string, string>>>((result, row) => {
    result[row.locale] = result[row.locale] ?? {};
    result[row.locale][row.field] = row.value;
    return result;
  }, {});
}
