"use server";

import { revalidatePath } from "next/cache";
import { cleanText, optionalDate, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

const ACTIVITY_TYPES = ["note", "call", "meeting", "email"] as const;

export async function addClientActivity(clientId: string, formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const rawType = cleanText(formData.get("type"));
  const type = rawType && ACTIVITY_TYPES.includes(rawType as (typeof ACTIVITY_TYPES)[number])
    ? rawType as (typeof ACTIVITY_TYPES)[number]
    : "note";

  service.addClientActivity(actor, {
    clientId,
    type,
    title: requiredText(formData.get("title"), "Aktivite başlığı zorunludur."),
    content: cleanText(formData.get("content")),
    activityDate: optionalDate(formData.get("activity_date")) ?? new Date(),
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}
