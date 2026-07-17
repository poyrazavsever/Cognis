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
    workspaceName: branding.organizationName ?? branding.applicationName,
    metaTitle: branding.applicationName,
    shortName: branding.shortName,
    primaryColor: branding.primaryColor,
    lightLogoUrl: branding.lightLogoUrl ?? "",
    darkLogoUrl: branding.darkLogoUrl ?? "",
    faviconUrl: branding.iconUrl ?? "",
    hasCustomLightLogo: Boolean(branding.lightLogoFileId),
    hasCustomDarkLogo: Boolean(branding.darkLogoFileId),
    hasCustomFavicon: Boolean(branding.iconFileId),
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

export async function saveGeneralSettings(formData: FormData) {
  const uploadedFileIds: string[] = [];
  let brandingCommitted = false;
  let actorForCleanup: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"] | null = null;

  try {
    const { actor } = await requireFreelancerBackend();
    actorForCleanup = actor;

    const workspaceName = cleanText(formData.get("workspaceName"));
    const metaTitle = cleanText(formData.get("metaTitle"));
    const shortName = cleanText(formData.get("shortName"));
    const primaryColor = cleanText(formData.get("primaryColor"))?.toUpperCase() ?? "";
    if (!workspaceName || workspaceName.length > 120) {
      return { error: "Workspace adı 1-120 karakter arasında olmalıdır." };
    }
    if (!metaTitle || metaTitle.length > 80) {
      return { error: "Tarayıcı başlığı 1-80 karakter arasında olmalıdır." };
    }
    if (!shortName || shortName.length > 24) {
      return { error: "Kısa uygulama adı 1-24 karakter arasında olmalıdır." };
    }
    if (!/^#[0-9A-F]{6}$/.test(primaryColor)) {
      return { error: "Ana renk #RRGGBB formatında olmalıdır." };
    }

    const brandingService = getBrandingService();
    const current = brandingService.getPublic();
    const lightLogoFileId = await uploadBrandingFile(formData, "lightLogo", "branding_logo", actor);
    if (lightLogoFileId) uploadedFileIds.push(lightLogoFileId);
    const darkLogoFileId = await uploadBrandingFile(formData, "darkLogo", "branding_logo", actor);
    if (darkLogoFileId) uploadedFileIds.push(darkLogoFileId);
    const iconFileId = await uploadBrandingFile(formData, "favicon", "branding_icon", actor);
    if (iconFileId) uploadedFileIds.push(iconFileId);

    const updated = brandingService.update(actor, {
      applicationName: metaTitle,
      shortName,
      organizationName: workspaceName,
      primaryColor,
      ...(lightLogoFileId ? { lightLogoFileId } : {}),
      ...(darkLogoFileId ? { darkLogoFileId } : {}),
      ...(iconFileId ? { iconFileId } : {}),
    });
    brandingCommitted = true;

    deleteSupersededBrandingFiles(actor, current, updated);

    revalidateBrandingPaths();
    return {
      success: true,
      workspaceName: updated.organizationName ?? updated.applicationName,
      metaTitle: updated.applicationName,
      shortName: updated.shortName,
      primaryColor: updated.primaryColor,
      lightLogoUrl: updated.lightLogoUrl ?? "",
      darkLogoUrl: updated.darkLogoUrl ?? "",
      faviconUrl: updated.iconUrl ?? "",
      hasCustomLightLogo: Boolean(updated.lightLogoFileId),
      hasCustomDarkLogo: Boolean(updated.darkLogoFileId),
      hasCustomFavicon: Boolean(updated.iconFileId),
    };
  } catch (error) {
    if (actorForCleanup && !brandingCommitted) {
      deleteBrandingFilesBestEffort(actorForCleanup, uploadedFileIds);
    }
    return { error: error instanceof Error ? error.message : "Genel ayarlar kaydedilemedi." };
  }
}

type BrandingAsset = "lightLogo" | "darkLogo" | "favicon";

export async function removeBrandingAsset(asset: BrandingAsset) {
  try {
    const { actor } = await requireFreelancerBackend();
    const brandingService = getBrandingService();
    const current = brandingService.getPublic();
    const fieldByAsset = {
      lightLogo: "lightLogoFileId",
      darkLogo: "darkLogoFileId",
      favicon: "iconFileId",
    } as const;
    if (!(asset in fieldByAsset)) {
      return { error: "Geçersiz marka görseli." };
    }
    const updated = brandingService.update(actor, { [fieldByAsset[asset]]: null });

    deleteSupersededBrandingFiles(actor, current, updated);
    revalidateBrandingPaths();
    return {
      success: true,
      lightLogoUrl: updated.lightLogoUrl ?? "",
      darkLogoUrl: updated.darkLogoUrl ?? "",
      faviconUrl: updated.iconUrl ?? "",
      hasCustomLightLogo: Boolean(updated.lightLogoFileId),
      hasCustomDarkLogo: Boolean(updated.darkLogoFileId),
      hasCustomFavicon: Boolean(updated.iconFileId),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Marka görseli kaldırılamadı." };
  }
}

async function uploadBrandingFile(
  formData: FormData,
  field: "lightLogo" | "darkLogo" | "favicon",
  kind: "branding_logo" | "branding_icon",
  actor: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"],
): Promise<string | null> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;

  return getFileService().upload(actor, {
    kind,
    originalName: file.name,
    claimedMimeType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
  }).id;
}

function deleteSupersededBrandingFiles(
  actor: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"],
  previous: ReturnType<ReturnType<typeof getBrandingService>["getPublic"]>,
  next: ReturnType<ReturnType<typeof getBrandingService>["getPublic"]>,
): void {
  const activeFileIds = new Set([
    next.lightLogoFileId,
    next.darkLogoFileId,
    next.iconFileId,
  ].filter((id): id is string => Boolean(id)));

  deleteBrandingFilesBestEffort(
    actor,
    [
      previous.lightLogoFileId,
      previous.darkLogoFileId,
      previous.iconFileId,
    ],
    activeFileIds,
  );
}

function deleteBrandingFilesBestEffort(
  actor: Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"],
  fileIds: Array<string | null>,
  exceptIds: ReadonlySet<string> = new Set(),
): void {
  const uniqueFileIds = new Set(fileIds.filter((id): id is string => Boolean(id && !exceptIds.has(id))));
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
