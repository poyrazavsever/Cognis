"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getSqliteConnection } from "@/server/db/client";
import {
  clients,
  instanceI18nSettings,
  instanceLocales,
} from "@/server/db/schema";
import { updateLanguagePreference } from "@/server/settings/preferences";
import { requirePortalBackend } from "@/server/web/portal";

export async function savePortalLanguagePreferenceAction(language: string) {
  try {
    const { actor } = await requirePortalBackend();
    const preferences = updateLanguagePreference(actor, { language });
    revalidatePortalSettings();
    return { success: true, language: preferences.language };
  } catch (error) {
    console.error("Portal language preference update failed", error);
    return { errorKey: "settings.languagePreference.errors.saveFailed" };
  }
}

export async function resetPortalLanguagePreferenceAction() {
  try {
    const { actor, context } = await requirePortalBackend();
    const language = readClientAssignedLanguage(context.profile.clientId);
    const preferences = updateLanguagePreference(actor, { language });
    revalidatePortalSettings();
    return { success: true, language: preferences.language };
  } catch (error) {
    console.error("Portal language preference reset failed", error);
    return { errorKey: "settings.portal.language.errors.resetFailed" };
  }
}

function readClientAssignedLanguage(clientId: string | null) {
  const { db } = getSqliteConnection();
  const defaultLocale = db
    .select({ defaultLocale: instanceI18nSettings.defaultLocale })
    .from(instanceI18nSettings)
    .where(eq(instanceI18nSettings.key, "default"))
    .get()?.defaultLocale ?? "tr";
  const portalLocale = clientId
    ? db
      .select({ portalLocale: clients.portalLocale })
      .from(clients)
      .where(eq(clients.id, clientId))
      .get()?.portalLocale
    : null;
  const candidate = portalLocale ?? defaultLocale;
  const active = db
    .select({ code: instanceLocales.code, status: instanceLocales.status })
    .from(instanceLocales)
    .where(eq(instanceLocales.code, candidate))
    .get();

  return active?.status === "active" ? candidate : defaultLocale;
}

function revalidatePortalSettings() {
  revalidatePath("/", "layout");
  revalidatePath("/portal", "layout");
  revalidatePath("/portal/settings/language");
}
