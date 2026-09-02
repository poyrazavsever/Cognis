"use server";

import { revalidatePath } from "next/cache";
import { cleanText, optionalDate, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { parseContentTranslationsFromFormData } from "@/server/i18n/content";

const EVENT_TYPES = ["meeting", "focus", "deadline", "personal", "finance"] as const;

function eventType(value: FormDataEntryValue | null) {
  return typeof value === "string" && EVENT_TYPES.includes(value as (typeof EVENT_TYPES)[number])
    ? value as (typeof EVENT_TYPES)[number]
    : "focus";
}

function payload(
  formData: FormData,
  service: Awaited<ReturnType<typeof requireFreelancerBackend>>["service"],
  actor: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"]
) {
  const context = service.contentTranslations.getLocalizationContext(actor);
  const translations = parseContentTranslationsFromFormData(formData, "calendar_event", context);
  const defaultTitle = translations?.[context.defaultLocale]?.title ?? "";
  const defaultDesc = translations?.[context.defaultLocale]?.description ?? "";

  return {
    title: defaultTitle || requiredText(formData.get("title"), "Etkinlik başlığı zorunludur."),
    description: defaultDesc || cleanText(formData.get("description")),
    type: eventType(formData.get("type")),
    startsAt: optionalDate(formData.get("starts_at")),
    endsAt: optionalDate(formData.get("ends_at")),
    clientId: cleanText(formData.get("client_id")),
    projectId: cleanText(formData.get("project_id")),
    taskId: cleanText(formData.get("task_id")),
    translations,
  };
}

function completeRelations(
  value: ReturnType<typeof payload>,
  service: Awaited<ReturnType<typeof requireFreelancerBackend>>["service"],
  actor: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"],
) {
  const task = value.taskId ? service.listTasks(actor).find((item) => item.id === value.taskId) : null;
  const projectId = value.projectId ?? task?.projectId ?? null;
  const project = projectId ? service.getProject(actor, projectId) : null;
  return {
    ...value,
    projectId,
    clientId: value.clientId ?? task?.clientId ?? project?.clientId ?? null,
  };
}

export async function createCalendarEventRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const value = completeRelations(payload(formData, backend.service, backend.actor), backend.service, backend.actor);
  if (!value.startsAt) throw new Error("Etkinlik başlangıç zamanı zorunludur.");
  backend.service.createCalendarEvent(backend.actor, value);
  revalidatePath("/calendar");
}

export async function updateCalendarEventRecord(formData: FormData) {
  const backend = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Etkinlik kaydı bulunamadı.");
  const value = completeRelations(payload(formData, backend.service, backend.actor), backend.service, backend.actor);
  if (!value.startsAt) throw new Error("Etkinlik başlangıç zamanı zorunludur.");
  backend.service.updateCalendarEvent(backend.actor, id, value);
  revalidatePath("/calendar");
}

export async function deleteCalendarEventRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  service.deleteCalendarEvent(
    actor,
    requiredText(formData.get("id"), "Silinecek etkinlik bulunamadı."),
  );
  revalidatePath("/calendar");
}
