"use server";

import { revalidatePath } from "next/cache";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText, requiredText } from "@/server/web/form-data";
import { parseContentTranslationsFromFormData } from "@/server/i18n/content";

const CLIENT_STATUSES = ["active", "paused", "archived"] as const;
const PIPELINE_STAGES = ["lead", "contacted", "proposal_sent", "won", "lost"] as const;

function enumValue<T extends readonly string[]>(
  value: FormDataEntryValue | string | null,
  values: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && values.includes(value) ? value as T[number] : fallback;
}

function cleanWebsite(value: FormDataEntryValue | null) {
  const website = cleanText(value)?.replace(/\s/g, "") ?? null;
  return website && !/^https?:\/\//i.test(website) ? `https://${website}` : website;
}

function readPayload(
  formData: FormData,
  service: Awaited<ReturnType<typeof requireFreelancerBackend>>["service"],
  actor: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"]
) {
  return {
    name: requiredText(formData.get("name"), "Müşteri adı zorunludur."),
    companyName: cleanText(formData.get("company_name")),
    email: cleanText(formData.get("email")),
    phone: cleanText(formData.get("phone")),
    website: cleanWebsite(formData.get("website")),
    status: enumValue(formData.get("status"), CLIENT_STATUSES, "active"),
    notes: cleanText(formData.get("notes")),
    pipelineStage: enumValue(formData.get("pipeline_stage"), PIPELINE_STAGES, "lead"),
    nextFollowUpDate: cleanText(formData.get("next_follow_up_date")),
    translations: parseContentTranslationsFromFormData(formData, "client", service.contentTranslations.getLocalizationContext(actor)),
  };
}

export async function createClientRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.createClient(actor, readPayload(formData, service, actor));
  revalidatePath("/clients");
}

export async function updateClientRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Müşteri kaydı bulunamadı.");
  service.updateClient(actor, id, readPayload(formData, service, actor));
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function archiveClientRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Arşivlenecek müşteri bulunamadı.");
  service.updateClient(actor, id, { status: "archived" });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function updateClientPipelineStage(id: string, stage: string) {
  const { actor, service } = await requireFreelancerBackend();
  service.updateClient(actor, id, {
    pipelineStage: enumValue(stage, PIPELINE_STAGES, "lead"),
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}
