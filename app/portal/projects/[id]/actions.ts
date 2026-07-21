"use server";

import { revalidatePath } from "next/cache";
import { cleanText } from "@/server/web/form-data";
import { resolvePortalLocale } from "@/server/i18n/resolver";
import { requirePortalBackend } from "@/server/web/portal";

export async function createRevisionRequest(projectId: string, formData: FormData) {
  try {
    const { actor, context, service } = await requirePortalBackend();
    const locale = await resolvePortalLocale(context);
    const description = cleanText(formData.get("description"));
    if (!description) return { errorKey: "portal.revision.errors.descriptionRequired" };

    service.requestRevision(actor, {
      projectId,
      description,
      sourceLocale: locale.locale,
    });
    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath("/portal/revisions");
    return { success: true };
  } catch (error) {
    console.error("Portal revision request failed", error);
    return {
      errorKey: "portal.revision.error",
    };
  }
}
