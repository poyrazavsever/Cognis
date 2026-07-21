"use server";

import { revalidatePath } from "next/cache";
import { getPublicAiSettings, updateAiSettings } from "@/server/settings/ai";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

export async function saveAiSettingsAction(formData: FormData) {
  try {
    const { actor } = await requireFreelancerBackend();
    const provider = cleanText(formData.get("provider")) ?? "";
    const model = cleanText(formData.get("model")) ?? "";
    const apiKey = cleanText(formData.get("apiKey")) ?? "";
    const current = getPublicAiSettings(actor);

    if (!["gemini", "openai", "groq", "ollama"].includes(provider)) {
      return { errorKey: "settings.ai.errors.provider" };
    }
    if (model.length > 200) {
      return { errorKey: "settings.ai.errors.model" };
    }
    if (apiKey.length > 4_096) {
      return { errorKey: "settings.ai.errors.apiKey" };
    }
    if (
      provider !== "ollama"
      && !apiKey
      && (!current.hasApiKey || current.provider !== provider)
    ) {
      return { errorKey: "settings.ai.errors.apiKeyRequired" };
    }

    const settings = updateAiSettings(actor, {
      provider,
      model,
      apiKey,
    });
    revalidatePath("/settings/ai");
    return {
      success: true,
      hasApiKey: settings.hasApiKey,
    };
  } catch (error) {
    console.error("AI settings update failed", error);
    return { errorKey: "settings.ai.errors.saveFailed" };
  }
}
