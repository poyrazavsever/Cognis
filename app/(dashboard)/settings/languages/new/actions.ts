"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import { DomainError } from "@/server/domain/errors";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

const SUPPORTED_BCP47_PATTERN = /^[a-z]{2}(?:-[A-Z]{2}[0-9]?)?$/;

export async function createLanguageAction(formData: FormData) {
  const rawCode = cleanText(formData.get("code")) ?? "";
  const name = cleanText(formData.get("name")) ?? "";
  const nativeName = cleanText(formData.get("nativeName")) ?? "";
  const fallbackLocale = cleanText(formData.get("fallbackLocale")) ?? "";
  const textDirection = cleanText(formData.get("textDirection")) ?? "";
  const code = canonicalizeSupportedLocale(rawCode);

  if (!code) return { errorKey: "settings.languageNew.errors.code" };
  if (!name || name.length > 80) {
    return { errorKey: "settings.languageNew.errors.name" };
  }
  if (!nativeName || nativeName.length > 80) {
    return { errorKey: "settings.languageNew.errors.nativeName" };
  }
  if (textDirection !== "ltr" && textDirection !== "rtl") {
    return { errorKey: "settings.languageNew.errors.direction" };
  }
  if (fallbackLocale === code) {
    return { errorKey: "settings.languageNew.errors.selfFallback" };
  }

  try {
    const { actor } = await requireFreelancerBackend();
    const service = new I18nService(getSqliteConnection().db);
    const locales = service.listLocales(actor);
    if (locales.some((locale) => locale.code === code)) {
      return { errorKey: "settings.languageNew.errors.duplicate" };
    }
    if (
      !fallbackLocale
      || !locales.some(
        (locale) => locale.code === fallbackLocale && locale.status !== "archived",
      )
    ) {
      return { errorKey: "settings.languageNew.errors.fallback" };
    }

    const locale = service.createLocale(actor, {
      code,
      name,
      nativeName,
      fallbackLocale,
      textDirection,
    });
    revalidatePath("/settings/languages");
    return { success: true, locale: locale.code };
  } catch (error) {
    console.error("Language creation failed", error);
    if (error instanceof DomainError) {
      if (error.details?.reason === "fallback_loop") {
        return { errorKey: "settings.languageNew.errors.fallbackLoop" };
      }
      if (error.details?.reason === "self_fallback") {
        return { errorKey: "settings.languageNew.errors.selfFallback" };
      }
      if (error.code === "CONFLICT") {
        return { errorKey: "settings.languageNew.errors.duplicate" };
      }
    }
    return { errorKey: "settings.languageNew.errors.createFailed" };
  }
}

function canonicalizeSupportedLocale(value: string): string | null {
  try {
    const [canonical] = Intl.getCanonicalLocales(value.replaceAll("_", "-"));
    return canonical && SUPPORTED_BCP47_PATTERN.test(canonical) ? canonical : null;
  } catch {
    return null;
  }
}
