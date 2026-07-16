"use server";

import { revalidatePath } from "next/cache";
import { cleanText, decimalToMinor, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

const TYPES = ["income", "expense"] as const;
const STATUSES = ["planned", "pending", "paid", "cancelled"] as const;

function enumValue<T extends readonly string[]>(value: FormDataEntryValue | null, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value) ? value as T[number] : fallback;
}

function payload(formData: FormData) {
  const amountMinor = decimalToMinor(formData.get("amount"));
  if (amountMinor == null) throw new Error("Tutar zorunludur.");
  return {
    type: enumValue(formData.get("type"), TYPES, "expense"),
    amountMinor,
    currency: cleanText(formData.get("currency")) ?? "USD",
    transactionDate: cleanText(formData.get("transaction_date")) ?? new Date().toISOString().slice(0, 10),
    category: cleanText(formData.get("category")),
    paymentStatus: enumValue(formData.get("payment_status"), STATUSES, "planned"),
    clientId: cleanText(formData.get("client_id")),
    projectId: cleanText(formData.get("project_id")),
    description: cleanText(formData.get("description")),
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
  backend.service.createFinanceTransaction(
    backend.actor,
    completeRelations(payload(formData), backend.service, backend.actor),
  );
  revalidatePath("/finance");
  revalidatePath("/clients");
  revalidatePath("/projects");
}

export async function updateFinanceTransactionRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Finans kaydı bulunamadı.");
  backend.service.updateFinanceTransaction(
    backend.actor,
    id,
    completeRelations(payload(formData), backend.service, backend.actor),
  );
  revalidatePath("/finance");
  revalidatePath("/clients");
  revalidatePath("/projects");
}

export async function deleteFinanceTransactionRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.deleteFinanceTransaction(
    actor,
    requiredText(formData.get("id"), "Silinecek finans kaydı bulunamadı."),
  );
  revalidatePath("/finance");
  revalidatePath("/clients");
  revalidatePath("/projects");
}
