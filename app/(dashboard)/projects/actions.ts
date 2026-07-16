"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getFileService } from "@/server/files/runtime";
import { cleanText, decimalToMinor, requiredText } from "@/server/web/form-data";
import { requireFreelancerBackend } from "@/server/web/freelancer";

const PROJECT_TYPES = ["client_project", "side_project"] as const;
const PROJECT_STATUSES = ["planning", "active", "paused", "completed", "cancelled"] as const;
const SECTION_CATEGORIES = ["overview", "problem", "goal", "audience", "scope", "design_system", "color_palette", "typography", "assets", "notes"] as const;
const REVISION_STATUSES = ["pending", "in_progress", "completed", "rejected"] as const;

function enumValue<T extends readonly string[]>(value: FormDataEntryValue | string | null, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value) ? value as T[number] : fallback;
}

function numberValue(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(typeof value === "string" ? value.replace(",", ".") : value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function projectPayload(formData: FormData) {
  const type = enumValue(formData.get("type"), PROJECT_TYPES, "client_project");
  return {
    name: requiredText(formData.get("name"), "Proje adı zorunludur."),
    type,
    clientId: type === "client_project" ? cleanText(formData.get("client_id")) : null,
    description: cleanText(formData.get("description")),
    status: enumValue(formData.get("status"), PROJECT_STATUSES, "planning"),
    startDate: cleanText(formData.get("start_date")),
    dueDate: cleanText(formData.get("due_date")),
    budgetAmountMinor: decimalToMinor(formData.get("budget_amount")),
    currency: cleanText(formData.get("currency")) ?? "USD",
    progress: Math.min(100, Math.max(0, Math.round(numberValue(formData.get("progress"))))),
    coverImageAlt: cleanText(formData.get("cover_image_alt")),
  };
}

async function uploadCover(
  actor: Parameters<ReturnType<typeof getFileService>["upload"]>[0],
  projectId: string,
  formData: FormData,
) {
  const file = formData.get("cover_image");
  if (!(file instanceof File) || file.size === 0) return null;
  const stored = getFileService().upload(actor, {
    kind: "project_asset",
    originalName: file.name,
    claimedMimeType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
    projectId,
    portalVisible: true,
  });
  return `/api/files/${stored.id}`;
}

export async function createProjectRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const id = randomUUID();
  service.createProject(actor, { id, ...projectPayload(formData) });
  try {
    const cover = await uploadCover(actor, id, formData);
    if (cover) service.updateProject(actor, id, { legacyCoverImagePath: cover });
  } catch (error) {
    service.deleteProject(actor, id);
    throw error;
  }
  revalidatePath("/projects");
}

export async function updateProjectRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Proje kaydı bulunamadı.");
  service.updateProject(actor, id, projectPayload(formData));
  const cover = await uploadCover(actor, id, formData);
  if (cover) service.updateProject(actor, id, { legacyCoverImagePath: cover });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function completeProjectRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Tamamlanacak proje bulunamadı.");
  service.updateProject(actor, id, { status: "completed", progress: 100 });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

function sectionPayload(formData: FormData) {
  return {
    projectId: requiredText(formData.get("project_id"), "Proje zorunludur."),
    category: enumValue(formData.get("category"), SECTION_CATEGORIES, "overview"),
    title: requiredText(formData.get("title"), "Planlama başlığı zorunludur."),
    content: cleanText(formData.get("content")),
    sortOrder: Math.max(0, Math.round(numberValue(formData.get("sort_order")))),
  };
}

export async function createProjectPlanningSectionRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const payload = sectionPayload(formData);
  service.addPlanningSection(actor, payload);
  revalidatePath("/projects");
  revalidatePath(`/projects/${payload.projectId}`);
}

export async function updateProjectPlanningSectionRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Planlama alanı bulunamadı.");
  const payload = sectionPayload(formData);
  if (!service.listPlanningSections(actor, payload.projectId).some((section) => section.id === id)) {
    throw new Error("Planlama alanı bu projeye ait değil.");
  }
  service.updatePlanningSection(actor, id, {
    category: payload.category,
    title: payload.title,
    content: payload.content,
    sortOrder: payload.sortOrder,
  });
  revalidatePath("/projects");
  revalidatePath(`/projects/${payload.projectId}`);
}

export async function deleteProjectPlanningSectionRecord(formData: FormData) {
  const { actor, service } = await requireFreelancerBackend();
  const id = requiredText(formData.get("id"), "Silinecek planlama alanı bulunamadı.");
  const projectId = requiredText(formData.get("project_id"), "Proje zorunludur.");
  if (!service.listPlanningSections(actor, projectId).some((section) => section.id === id)) {
    throw new Error("Planlama alanı bu projeye ait değil.");
  }
  service.deletePlanningSection(actor, id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function updateRevisionStatus(id: string, projectId: string, status: string) {
  const { actor, service } = await requireFreelancerBackend();
  service.updateRevisionStatus(actor, id, enumValue(status, REVISION_STATUSES, "pending"), projectId);
  revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectSettings(projectId: string, progressType: "manual" | "auto", progress: number, revisionQuota: number) {
  const { actor, service } = await requireFreelancerBackend();
  service.updateProject(actor, projectId, {
    progressType,
    progress: Math.min(100, Math.max(0, Math.round(progress))),
    revisionQuota: Math.max(0, Math.round(revisionQuota)),
  });
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}
