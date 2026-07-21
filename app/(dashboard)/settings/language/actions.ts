"use server";

import { revalidatePath } from "next/cache";
import { updateLanguagePreference } from "@/server/settings/preferences";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export async function saveLanguagePreferenceAction(language: string) {
  try {
    const { actor } = await requireFreelancerBackend();
    const preferences = updateLanguagePreference(actor, { language });
    revalidatePath("/", "layout");
    revalidatePath("/settings/language");
    return { success: true, language: preferences.language };
  } catch (error) {
    console.error("Language preference update failed", error);
    return { errorKey: "settings.languagePreference.errors.saveFailed" };
  }
}
