"use server";

import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/auth";
import {
  COLOR_MODE_COOKIE,
  COLOR_MODE_COOKIE_MAX_AGE,
} from "@/lib/color-mode";
import { getServerConfig } from "@/server/config";
import { getBrandingService } from "@/server/branding/runtime";
import { getSqliteConnection } from "@/server/db/client";
import { appProfiles } from "@/server/db/schema";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getFileService } from "@/server/files/runtime";
import { getPublicAiSettings, updateAiSettings } from "@/server/settings/ai";
import {
  getUserPreferences,
  updateColorModePreference,
} from "@/server/settings/preferences";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

export async function loadSettings() {
  const { context, actor } = await requireFreelancerBackend();
  const [firstName = "", ...lastNameParts] = context.profile.displayName.trim().split(/\s+/);
  const ai = getPublicAiSettings(actor);
  const preferences = getUserPreferences(actor);
  const branding = getBrandingService().getPublic();

  return {
    firstName,
    lastName: lastNameParts.join(" "),
    avatarUrl: context.user.image ?? "",
    aiProvider: ai.provider,
    hasApiKey: ai.hasApiKey,
    colorMode: preferences.colorMode,
    workspaceName: branding.applicationName,
    primaryColor: branding.primaryColor,
    logoUrl: branding.lightLogoUrl ?? branding.darkLogoUrl ?? "",
    hasCustomLogo: Boolean(branding.lightLogoFileId || branding.darkLogoFileId),
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

export async function saveColorMode(colorMode: string) {
  try {
    const { actor } = await requireFreelancerBackend();
    const preferences = updateColorModePreference(actor, { colorMode });
    const config = getServerConfig();

    (await cookies()).set(COLOR_MODE_COOKIE, preferences.colorMode, {
      httpOnly: false,
      maxAge: COLOR_MODE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: config.secureCookies,
    });

    revalidatePath("/", "layout");
    return { success: true, colorMode: preferences.colorMode };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Tema tercihi kaydedilemedi." };
  }
}

export async function saveWorkspaceBranding(formData: FormData) {
  let uploadedLogoId: string | null = null;
  let brandingCommitted = false;
  let actorForCleanup: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"] | null = null;

  try {
    const { actor } = await requireFreelancerBackend();
    actorForCleanup = actor;

    const workspaceName = cleanText(formData.get("workspaceName"));
    const primaryColor = cleanText(formData.get("primaryColor"))?.toUpperCase() ?? "";
    if (!workspaceName || workspaceName.length > 80) {
      return { error: "Workspace adı 1-80 karakter arasında olmalıdır." };
    }
    if (!/^#[0-9A-F]{6}$/.test(primaryColor)) {
      return { error: "Ana renk #RRGGBB formatında olmalıdır." };
    }

    const brandingService = getBrandingService();
    const fileService = getFileService();
    const current = brandingService.getPublic();
    const logo = formData.get("logo");

    if (logo instanceof File && logo.size > 0) {
      uploadedLogoId = fileService.upload(actor, {
        kind: "branding_logo",
        originalName: logo.name,
        claimedMimeType: logo.type,
        bytes: new Uint8Array(await logo.arrayBuffer()),
      }).id;
    }

    const updated = brandingService.update(actor, {
      applicationName: workspaceName,
      shortName: Array.from(workspaceName).slice(0, 24).join(""),
      organizationName: workspaceName,
      primaryColor,
      ...(uploadedLogoId
        ? {
            lightLogoFileId: uploadedLogoId,
            darkLogoFileId: uploadedLogoId,
          }
        : {}),
    });
    brandingCommitted = true;

    if (uploadedLogoId) {
      deleteBrandingFilesBestEffort(
        actor,
        [current.lightLogoFileId, current.darkLogoFileId],
        uploadedLogoId,
      );
    }

    revalidateBrandingPaths();
    return {
      success: true,
      workspaceName: updated.applicationName,
      primaryColor: updated.primaryColor,
      logoUrl: updated.lightLogoUrl ?? updated.darkLogoUrl ?? "",
      hasCustomLogo: Boolean(updated.lightLogoFileId || updated.darkLogoFileId),
    };
  } catch (error) {
    if (uploadedLogoId && actorForCleanup && !brandingCommitted) {
      deleteBrandingFilesBestEffort(actorForCleanup, [uploadedLogoId]);
    }
    return { error: error instanceof Error ? error.message : "Workspace görünümü kaydedilemedi." };
  }
}

export async function removeWorkspaceLogo() {
  try {
    const { actor } = await requireFreelancerBackend();
    const brandingService = getBrandingService();
    const current = brandingService.getPublic();
    const updated = brandingService.update(actor, {
      lightLogoFileId: null,
      darkLogoFileId: null,
    });

    deleteBrandingFilesBestEffort(actor, [
      current.lightLogoFileId,
      current.darkLogoFileId,
    ]);
    revalidateBrandingPaths();
    return {
      success: true,
      logoUrl: updated.lightLogoUrl ?? updated.darkLogoUrl ?? "",
      hasCustomLogo: false,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Logo kaldırılamadı." };
  }
}

function deleteBrandingFilesBestEffort(
  actor: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"],
  fileIds: Array<string | null>,
  exceptId?: string,
): void {
  const uniqueFileIds = new Set(fileIds.filter((id): id is string => Boolean(id && id !== exceptId)));
  for (const fileId of uniqueFileIds) {
    try {
      getFileService().delete(actor, fileId);
    } catch {
      // The branding update is authoritative; orphan cleanup can safely be retried later.
    }
  }
}

function revalidateBrandingPaths(): void {
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/portal", "layout");
  revalidatePath("/manifest.webmanifest");
}
