"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import { DomainError } from "@/server/domain/errors";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

export async function updateLanguageMetadataAction(
  localeCode: string,
  formData: FormData,
) {
  const name = cleanText(formData.get("name")) ?? "";
  const nativeName = cleanText(formData.get("nativeName")) ?? "";
  const fallbackLocale = cleanText(formData.get("fallbackLocale")) ?? "";
  const textDirection = cleanText(formData.get("textDirection")) ?? "";

  if (!name || name.length > 80) {
    return { errorKey: "settings.languageDetail.errors.name" };
  }
  if (!nativeName || nativeName.length > 80) {
    return { errorKey: "settings.languageDetail.errors.nativeName" };
  }
  if (textDirection !== "ltr" && textDirection !== "rtl") {
    return { errorKey: "settings.languageDetail.errors.direction" };
  }
  if (fallbackLocale === localeCode) {
    return { errorKey: "settings.languageDetail.errors.selfFallback" };
  }

  try {
    const { actor } = await requireFreelancerBackend();
    const service = new I18nService(getSqliteConnection().db);
    const current = service
      .listLocales(actor)
      .find((locale) => locale.code === localeCode);
    if (!current) return { errorKey: "settings.languageDetail.errors.notFound" };
    if (current.builtIn) {
      return { errorKey: "settings.languageDetail.errors.builtInMetadata" };
    }

    const locale = service.updateLocale(actor, localeCode, {
      name,
      nativeName,
      fallbackLocale,
      textDirection,
    });
    revalidateLanguage(locale.code);
    return { success: true };
  } catch (error) {
    console.error("Language metadata update failed", error);
    if (error instanceof DomainError) {
      if (error.details?.reason === "fallback_loop") {
        return { errorKey: "settings.languageDetail.errors.fallbackLoop" };
      }
      if (error.details?.reason === "self_fallback") {
        return { errorKey: "settings.languageDetail.errors.selfFallback" };
      }
    }
    return { errorKey: "settings.languageDetail.errors.metadataFailed" };
  }
}

export async function activateLanguageAction(localeCode: string) {
  try {
    const { actor } = await requireFreelancerBackend();
    const service = new I18nService(getSqliteConnection().db);
    const readiness = service.getLocaleReadiness(actor, localeCode);
    if (!readiness.canActivate) {
      return {
        errorKey: "settings.languageDetail.errors.notReady",
        missingCriticalCount: readiness.missingCriticalKeys.length,
      };
    }
    service.updateLocale(actor, localeCode, { status: "active" });
    revalidateLanguage(localeCode);
    return { success: true };
  } catch (error) {
    console.error("Language activation failed", error);
    return { errorKey: "settings.languageDetail.errors.activateFailed" };
  }
}

export async function setDetailDefaultLocaleAction(localeCode: string) {
  try {
    const { actor } = await requireFreelancerBackend();
    const service = new I18nService(getSqliteConnection().db);
    service.setDefaultLocale(actor, localeCode);
    revalidateLanguage(localeCode);
    return { success: true };
  } catch (error) {
    console.error("Detail default locale update failed", error);
    return { errorKey: "settings.languageDetail.errors.defaultFailed" };
  }
}

export async function archiveLanguageAction(localeCode: string) {
  try {
    const { actor } = await requireFreelancerBackend();
    const service = new I18nService(getSqliteConnection().db);
    const readiness = service.getLocaleReadiness(actor, localeCode);
    if (!readiness.canArchive) {
      return { errorKey: "settings.languageDetail.errors.archiveBlocked" };
    }
    service.archiveLocale(actor, localeCode);
    revalidateLanguage(localeCode);
    return { success: true };
  } catch (error) {
    console.error("Language archive failed", error);
    return { errorKey: "settings.languageDetail.errors.archiveFailed" };
  }
}

function revalidateLanguage(localeCode: string) {
  revalidatePath("/", "layout");
  revalidatePath("/settings/language");
  revalidatePath("/settings/languages");
  revalidatePath(`/settings/languages/${localeCode}`);
}
