"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export async function exportTranslationsAction() {
  const { actor } = await requireFreelancerBackend();
  const service = new I18nService(getSqliteConnection().db);
  const pkg = service.exportPackage(actor);
  return { package: pkg };
}

export async function importTranslationsAction(content: string) {
  const { actor } = await requireFreelancerBackend();
  const service = new I18nService(getSqliteConnection().db);
  
  try {
    const data = JSON.parse(content);
    service.importPackage(actor, data);
    revalidatePath("/settings/languages");
    return { success: true };
  } catch (error) {
    console.error("Import error:", error);
    return { errorKey: "common.error.description", details: error instanceof Error ? error.message : String(error) };
  }
}
