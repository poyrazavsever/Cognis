"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, parseContentTranslationsFromFormData } from "@/server/i18n/content";
import { cleanText, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

const CYCLES = ["weekly", "monthly", "yearly"] as const;
const STATUSES = ["active", "cancelled"] as const;

function enumValue<T extends readonly string[]>(value: FormDataEntryValue | null, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value) ? value as T[number] : fallback;
}

function payload(formData: FormData, translations: Record<string, Record<string, string | null>>, defaultLocale: string) {
  const amountMinor = amountToMinor(formData.get("amount"));
  if (amountMinor == null) throw new Error("business.subscriptions.errors.amountRequired");
  const localized = translations[defaultLocale] ?? {};

  return {
    name: localized.name ?? "",
    category: localized.category ?? null,
    amountMinor,
    currency: cleanText(formData.get("currency")) ?? "TRY",
    billingCycle: enumValue(formData.get("billing_cycle"), CYCLES, "monthly"),
    nextBillingDate: cleanText(formData.get("next_billing_date")),
    status: enumValue(formData.get("status"), STATUSES, "active"),
  };
}

function amountToMinor(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : "";
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("business.subscriptions.errors.amountRequired");
  return Math.round((amount + Number.EPSILON) * 100);
}

export async function createSubscriptionRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const i18n = new ContentTranslationService(getSqliteConnection().db);
  const context = i18n.getLocalizationContext(backend.actor);
  const translations = parseContentTranslationsFromFormData(formData, "subscription", context);
  backend.service.createSubscription(backend.actor, {
    ...payload(formData, translations, context.defaultLocale),
    translations,
  });
  revalidatePath("/business/subscriptions");
}

export async function updateSubscriptionRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const i18n = new ContentTranslationService(getSqliteConnection().db);
  const context = i18n.getLocalizationContext(backend.actor);
  const translations = parseContentTranslationsFromFormData(formData, "subscription", context);
  backend.service.updateSubscription(
    backend.actor,
    requiredText(formData.get("id"), "business.subscriptions.errors.notFound"),
    {
      ...payload(formData, translations, context.defaultLocale),
      translations,
    },
  );
  revalidatePath("/business/subscriptions");
}

export async function deleteSubscriptionRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.deleteSubscription(
    actor,
    requiredText(formData.get("id"), "business.subscriptions.errors.deleteNotFound"),
  );
  revalidatePath("/business/subscriptions");
}
