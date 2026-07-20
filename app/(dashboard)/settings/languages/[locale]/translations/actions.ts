"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export async function upsertTranslationsAction(
  locale: string,
  payload: { namespace: string; key: string; value: string }[]
) {
  const { actor } = await requireFreelancerBackend();
  const service = new I18nService(getSqliteConnection().db);

  try {
    for (const item of payload) {
      if (item.value.trim() === "") {
        try {
          service.resetUiTranslation(actor, { locale, namespace: item.namespace, key: item.key });
        } catch (e) {
          // ignore if it doesn't exist
        }
      } else {
        service.upsertUiTranslation(actor, { locale, namespace: item.namespace, key: item.key, value: item.value });
      }
    }
    revalidatePath(`/settings/languages/${locale}`);
    revalidatePath(`/settings/languages/${locale}/translations`);
    return { success: true };
  } catch (error) {
    console.error("Translation save error:", error);
    return { errorKey: "common.error.description" };
  }
}
