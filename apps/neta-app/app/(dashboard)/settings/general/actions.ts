"use server";

import { revalidatePath } from "next/cache";
import { getBrandingService } from "@/server/branding/runtime";
import { getSqliteConnection } from "@/server/db/client";
import {
  ContentTranslationService,
  parseContentTranslationsFromFormData,
} from "@/server/i18n/content";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

export async function saveGeneralSettingsAction(formData: FormData) {
  try {
    const { actor } = await requireFreelancerBackend();
    const workspaceName = cleanText(formData.get("workspaceName"));
    const metaTitle = cleanText(formData.get("metaTitle"));
    const shortName = cleanText(formData.get("shortName"));

    if (!workspaceName || workspaceName.length > 120) {
      return { errorKey: "settings.general.errors.workspaceName" };
    }
    if (!metaTitle || metaTitle.length > 80) {
      return { errorKey: "settings.general.errors.metaTitle" };
    }
    if (!shortName || shortName.length > 24) {
      return { errorKey: "settings.general.errors.shortName" };
    }

    const contentI18n = new ContentTranslationService(getSqliteConnection().db);
    const localization = contentI18n.getLocalizationContext(actor);
    const activeLocalization = {
      ...localization,
      locales: localization.locales.filter((locale) => locale.status === "active"),
    };
    const translations = parseContentTranslationsFromFormData(
      formData,
      "branding",
      activeLocalization,
    );

    const defaultContent = translations[activeLocalization.defaultLocale] ?? {};
    const branding = getBrandingService().update(actor, {
      applicationName: metaTitle,
      shortName,
      organizationName: workspaceName,
      portalWelcomeText: defaultContent.portalWelcome ?? null,
      portalFooterText: defaultContent.portalFooter ?? null,
    });
    contentI18n.upsertEntityTranslations("branding", "default", translations);

    revalidateGeneralSettings();
    return {
      success: true,
      data: {
        workspaceName: branding.organizationName ?? branding.applicationName,
        metaTitle: branding.applicationName,
        shortName: branding.shortName,
      },
    };
  } catch (error) {
    console.error("General settings update failed", error);
    return { errorKey: "settings.general.errors.saveFailed" };
  }
}

function revalidateGeneralSettings() {
  revalidatePath("/", "layout");
  revalidatePath("/settings/general");
  revalidatePath("/portal", "layout");
  revalidatePath("/manifest.webmanifest");
}
