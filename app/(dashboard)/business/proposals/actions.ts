"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, parseContentTranslationsFromFormData } from "@/server/i18n/content";
import { cleanText, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

const STATUSES = ["draft", "sent", "accepted", "rejected"] as const;

function enumValue<T extends readonly string[]>(value: FormDataEntryValue | null, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value) ? value as T[number] : fallback;
}

function payload(formData: FormData, translations: Record<string, Record<string, string | null>>, defaultLocale: string) {
  const amountMinor = amountToMinor(formData.get("amount"));
  if (amountMinor == null) throw new Error("business.proposals.errors.amountRequired");
  const localized = translations[defaultLocale] ?? {};

  return {
    clientId: cleanText(formData.get("client_id")),
    projectId: cleanText(formData.get("project_id")),
    title: localized.title ?? "",
    description: localized.description ?? null,
    amountMinor,
    currency: cleanText(formData.get("currency")) ?? "TRY",
    status: enumValue(formData.get("status"), STATUSES, "draft"),
    validUntil: optionalBusinessDate(formData.get("valid_until")),
  };
}

function amountToMinor(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : "";
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("business.proposals.errors.amountRequired");
  return Math.round((amount + Number.EPSILON) * 100);
}

function optionalBusinessDate(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  if (!text) return null;
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("business.proposals.errors.invalidDate");
  return date;
}

export async function createProposalRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const i18n = new ContentTranslationService(getSqliteConnection().db);
  const context = i18n.getLocalizationContext(backend.actor);
  const translations = parseContentTranslationsFromFormData(formData, "proposal", context);
  backend.service.createProposal(backend.actor, {
    ...payload(formData, translations, context.defaultLocale),
    translations,
  });
  revalidatePath("/business/proposals");
}

export async function updateProposalRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const i18n = new ContentTranslationService(getSqliteConnection().db);
  const context = i18n.getLocalizationContext(backend.actor);
  const translations = parseContentTranslationsFromFormData(formData, "proposal", context);
  backend.service.updateProposal(
    backend.actor,
    requiredText(formData.get("id"), "business.proposals.errors.notFound"),
    {
      ...payload(formData, translations, context.defaultLocale),
      translations,
    },
  );
  revalidatePath("/business/proposals");
}

export async function deleteProposalRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.deleteProposal(
    actor,
    requiredText(formData.get("id"), "business.proposals.errors.deleteNotFound"),
  );
  revalidatePath("/business/proposals");
}
