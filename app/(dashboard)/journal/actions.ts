"use server";

import { revalidatePath } from "next/cache";
import { getSqliteConnection } from "@/server/db/client";
import {
  ContentTranslationService,
  parseContentTranslationsFromFormData,
} from "@/server/i18n/content";
import { cleanText, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

function score(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function payload(formData: FormData, translations?: Record<string, Record<string, string | null>>, defaultLocale = "tr") {
  const moodScore = score(formData.get("mood_score"));
  const energyScore = score(formData.get("energy_score"));
  if (!moodScore || !energyScore) throw new Error("journal.errors.scoresRequired");
  const localized = translations?.[defaultLocale] ?? {};
  return {
    entryDate: cleanText(formData.get("log_date")) ?? new Date().toISOString().slice(0, 10),
    moodScore,
    energyScore,
    workSatisfactionScore: score(formData.get("work_satisfaction_score")),
    moodLabel: localized.moodLabel ?? cleanText(formData.get("mood_label")),
    note: localized.note ?? cleanText(formData.get("note")),
  };
}

export async function createDailyLogRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const i18n = new ContentTranslationService(getSqliteConnection().db);
  const context = i18n.getLocalizationContext(actor);
  const translations = parseContentTranslationsFromFormData(formData, "journal_entry", context);
  service.saveJournalEntry(actor, { ...payload(formData, translations, context.defaultLocale), translations });
  revalidatePath("/journal");
}

export async function updateDailyLogRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const i18n = new ContentTranslationService(getSqliteConnection().db);
  const context = i18n.getLocalizationContext(actor);
  const translations = parseContentTranslationsFromFormData(formData, "journal_entry", context);
  service.updateJournalEntry(
    actor,
    requiredText(formData.get("id"), "journal.errors.notFound"),
    { ...payload(formData, translations, context.defaultLocale), translations },
  );
  revalidatePath("/journal");
}

export async function deleteDailyLogRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.deleteJournalEntry(
    actor,
    requiredText(formData.get("id"), "journal.errors.deleteNotFound"),
  );
  revalidatePath("/journal");
}
