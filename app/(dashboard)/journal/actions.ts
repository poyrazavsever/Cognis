"use server";

import { revalidatePath } from "next/cache";
import { cleanText, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

function score(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function payload(formData: FormData) {
  const moodScore = score(formData.get("mood_score"));
  const energyScore = score(formData.get("energy_score"));
  if (!moodScore || !energyScore) throw new Error("Mood ve enerji skorları zorunludur.");
  return {
    entryDate: cleanText(formData.get("log_date")) ?? new Date().toISOString().slice(0, 10),
    moodScore,
    energyScore,
    workSatisfactionScore: score(formData.get("work_satisfaction_score")),
    note: cleanText(formData.get("note")),
  };
}

export async function createDailyLogRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.saveJournalEntry(actor, payload(formData));
  revalidatePath("/journal");
}

export async function updateDailyLogRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.updateJournalEntry(
    actor,
    requiredText(formData.get("id"), "Günlük kaydı bulunamadı."),
    payload(formData),
  );
  revalidatePath("/journal");
}

export async function deleteDailyLogRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.deleteJournalEntry(
    actor,
    requiredText(formData.get("id"), "Silinecek günlük kaydı bulunamadı."),
  );
  revalidatePath("/journal");
}
