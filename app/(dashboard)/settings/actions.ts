"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/auth";
import { getSqliteConnection } from "@/server/db/client";
import { appProfiles } from "@/server/db/schema";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getFileService } from "@/server/files/runtime";
import { getPublicAiSettings, updateAiSettings } from "@/server/settings/ai";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

export async function loadSettings() {
  const { context, actor } = await requireFreelancerBackend();
  const [firstName = "", ...lastNameParts] = context.profile.displayName.trim().split(/\s+/);
  const ai = getPublicAiSettings(actor);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
    avatarUrl: context.user.image ?? "",
    aiProvider: ai.provider,
    hasApiKey: ai.hasApiKey,
  };
}

export async function updateProfile(formData: FormData) {
  try {
    const { context } = await requireFreelancerBackend();
    const firstName = cleanText(formData.get("firstName"));
    const lastName = cleanText(formData.get("lastName"));
    if (!firstName || !lastName || firstName.length > 80 || lastName.length > 120) {
      return { error: "Ad ve soyad zorunludur." };
    }

    const displayName = `${firstName} ${lastName}`;
    await auth.api.updateUser({
      headers: await headers(),
      body: { name: displayName },
    });
    getSqliteConnection().db
      .update(appProfiles)
      .set({ displayName, updatedAt: new Date() })
      .where(eq(appProfiles.authUserId, context.user.id))
      .run();

    const avatar = formData.get("avatar");
    if (avatar instanceof File && avatar.size > 0) {
      getFileService().upload(domainActorFromSession(context), {
        kind: "avatar",
        originalName: avatar.name,
        claimedMimeType: avatar.type,
        bytes: new Uint8Array(await avatar.arrayBuffer()),
      });
    }

    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Profil güncellenemedi." };
  }
}

export async function updatePassword(formData: FormData) {
  const currentPassword = cleanText(formData.get("currentPassword"));
  const newPassword = cleanText(formData.get("password"));

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return { error: "Mevcut şifre zorunludur; yeni şifre en az 8 karakter olmalıdır." };
  }

  try {
    await requireFreelancerBackend();
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
    });
    return { success: true };
  } catch {
    return { error: "Mevcut şifre doğrulanamadı veya şifre güncellenemedi." };
  }
}

export async function saveAiSettings(provider: string, apiKey: string) {
  try {
    const { actor } = await requireFreelancerBackend();
    const settings = updateAiSettings(actor, { provider, apiKey });
    revalidatePath("/settings");
    return { success: true, hasApiKey: settings.hasApiKey };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ayarlar kaydedilemedi." };
  }
}
