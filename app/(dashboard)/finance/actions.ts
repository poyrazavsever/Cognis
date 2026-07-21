"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import {
  ContentTranslationService,
  parseContentTranslationsFromFormData,
} from "@/server/i18n/content";
import { cleanText, decimalToMinor, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

const TYPES = ["income", "expense"] as const;
const STATUSES = ["planned", "pending", "paid", "cancelled"] as const;

function enumValue<T extends readonly string[]>(value: FormDataEntryValue | null, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value) ? value as T[number] : fallback;
}

function payload(formData: FormData, translations?: Record<string, Record<string, string | null>>, defaultLocale = "tr") {
  const amountMinor = decimalToMinor(formData.get("amount"));
  if (amountMinor == null) throw new Error("finance.errors.amountRequired");
  const localized = translations?.[defaultLocale] ?? {};
  return {
    type: enumValue(formData.get("type"), TYPES, "expense"),
    amountMinor,
    currency: cleanText(formData.get("currency")) ?? "USD",
    transactionDate: cleanText(formData.get("transaction_date")) ?? new Date().toISOString().slice(0, 10),
    category: localized.category ?? cleanText(formData.get("category")),
    paymentStatus: enumValue(formData.get("payment_status"), STATUSES, "planned"),
    clientId: cleanText(formData.get("client_id")),
    projectId: cleanText(formData.get("project_id")),
    description: localized.description ?? cleanText(formData.get("description")),
  };
}

function completeRelations(
  value: ReturnType<typeof payload>,
  service: Awaited<ReturnType<typeof requireFreelancerBackend>>["service"],
  actor: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"],
) {
  const project = value.projectId ? service.getProject(actor, value.projectId) : null;
  return { ...value, clientId: value.clientId ?? project?.clientId ?? null };
}

export async function createFinanceTransactionRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const i18n = new ContentTranslationService(getSqliteConnection().db);
  const context = i18n.getLocalizationContext(backend.actor);
  const translations = parseContentTranslationsFromFormData(formData, "finance_transaction", context);
  const data = payload(formData, translations, context.defaultLocale);
  backend.service.createFinanceTransaction(
    backend.actor,
    { ...completeRelations(data, backend.service, backend.actor), translations },
  );
  revalidatePath("/finance");
  revalidatePath("/clients");
  revalidatePath("/projects");
}

export async function updateFinanceTransactionRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const i18n = new ContentTranslationService(getSqliteConnection().db);
  const context = i18n.getLocalizationContext(backend.actor);
  const translations = parseContentTranslationsFromFormData(formData, "finance_transaction", context);
  const id = requiredText(formData.get("id"), "finance.errors.notFound");
  const data = payload(formData, translations, context.defaultLocale);
  backend.service.updateFinanceTransaction(
    backend.actor,
    id,
    { ...completeRelations(data, backend.service, backend.actor), translations },
  );
  revalidatePath("/finance");
  revalidatePath("/clients");
  revalidatePath("/projects");
}

export async function deleteFinanceTransactionRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.deleteFinanceTransaction(
    actor,
    requiredText(formData.get("id"), "finance.errors.deleteNotFound"),
  );
  revalidatePath("/finance");
  revalidatePath("/clients");
  revalidatePath("/projects");
}
