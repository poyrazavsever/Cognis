"use server";

import { revalidatePath } from "next/cache";
import { cleanText } from "@/server/web/form-data";
import { requirePortalBackend } from "@/server/web/portal";

export async function createRevisionRequest(projectId: string, formData: FormData) {
  try {
    const { actor, service } = await requirePortalBackend();
    const description = cleanText(formData.get("description"));
    if (!description) return { error: "Revizyon açıklaması boş olamaz." };

    service.requestRevision(actor, { projectId, description });
    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath("/portal/revisions");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Revizyon talebi oluşturulamadı.",
    };
  }
}
