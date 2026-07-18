"use server";

import { revalidatePath } from "next/cache";
import { cleanText, optionalDate, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

function enumValue<T extends readonly string[]>(value: FormDataEntryValue | string | null, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value) ? value as T[number] : fallback;
}

function minutes(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

function payload(formData: FormData) {
  const dueAt = optionalDate(formData.get("due_at"));
  return {
    title: requiredText(formData.get("title"), "Görev başlığı zorunludur."),
    description: cleanText(formData.get("description")),
    status: enumValue(formData.get("status"), TASK_STATUSES, "todo"),
    priority: enumValue(formData.get("priority"), TASK_PRIORITIES, "medium"),
    clientId: cleanText(formData.get("client_id")),
    projectId: cleanText(formData.get("project_id")),
    scheduledDate: dueAt?.toISOString().slice(0, 10) ?? null,
    dueAt,
    estimatedMinutes: minutes(formData.get("estimated_minutes")),
    actualMinutes: minutes(formData.get("actual_minutes")),
    isPublicToClient: formData.get("is_public_to_client") === "on",
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

function revalidate(projectId?: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/projects");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createTaskRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const value = completeRelations(payload(formData), service, actor);
  service.createTask(actor, value);
  revalidate(value.projectId);
}

export async function updateTaskRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Görev kaydı bulunamadı.");
  const value = completeRelations(payload(formData), service, actor);
  const current = service.listTasks(actor).find((task) => task.id === id);
  service.updateTask(actor, id, value);
  revalidate(value.projectId);
  if (current?.projectId !== value.projectId) revalidate(current?.projectId);
}

export async function completeTaskRecord(formData: FormData) {
  const id = requiredText(formData.get("id"), "Tamamlanacak görev bulunamadı.");
  const projectId = cleanText(formData.get("project_id"));
  const { actor, service } = await requireFreelancerBackend();
  service.updateTask(actor, id, { status: "done" });
  revalidate(projectId);
}

export async function updateTaskStatusRecord(taskId: string, status: string, projectId?: string) {
  const { actor, service } = await requireFreelancerBackend();
  service.updateTask(actor, taskId, { status: enumValue(status, TASK_STATUSES, "todo") });
  revalidate(projectId);
}

export async function deleteTaskRecord(formData: FormData) {
  const id = requiredText(formData.get("id"), "Silinecek görev bulunamadı.");
  const projectId = cleanText(formData.get("project_id"));
  const { actor, service } = await requireFreelancerBackend();
  service.deleteTask(actor, id);
  revalidate(projectId);
}
