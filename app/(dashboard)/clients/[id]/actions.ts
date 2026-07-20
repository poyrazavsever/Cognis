"use server";

import { revalidatePath } from "next/cache";
import { cleanText, optionalDate, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { parseContentTranslationsFromFormData } from "@/server/i18n/content";

const ACTIVITY_TYPES = ["note", "call", "meeting", "email"] as const;

export async function addClientActivity(clientId: string, formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const rawType = cleanText(formData.get("type"));
  const type = rawType && ACTIVITY_TYPES.includes(rawType as (typeof ACTIVITY_TYPES)[number])
    ? rawType as (typeof ACTIVITY_TYPES)[number]
    : "note";

  const context = service.contentTranslations.getLocalizationContext(actor);
  const translations = parseContentTranslationsFromFormData(formData, "client_activity", context);
  const defaultTitle = translations?.[context.defaultLocale]?.title ?? "";
  const defaultContent = translations?.[context.defaultLocale]?.content ?? "";

  service.addClientActivity(actor, {
    clientId,
    type,
    title: defaultTitle || requiredText(formData.get("title"), "Aktivite başlığı zorunludur."),
    content: defaultContent || cleanText(formData.get("content")),
    activityDate: optionalDate(formData.get("activity_date")) ?? new Date(),
    translations,
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}
