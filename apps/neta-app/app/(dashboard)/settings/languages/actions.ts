"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export async function setInstanceDefaultLocaleAction(code: string) {
  try {
    const { actor } = await requireFreelancerBackend();
    const service = new I18nService(getSqliteConnection().db);
    const settings = service.setDefaultLocale(actor, code);
    revalidateLanguageManagement();
    return { success: true, defaultLocale: settings.defaultLocale };
  } catch (error) {
    console.error("Default locale update failed", error);
    return { errorKey: "settings.languages.errors.defaultFailed" };
  }
}

function revalidateLanguageManagement() {
  revalidatePath("/", "layout");
  revalidatePath("/settings/languages");
  revalidatePath("/settings/language");
}
