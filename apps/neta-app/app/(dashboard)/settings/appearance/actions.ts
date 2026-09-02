"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  COLOR_MODE_COOKIE,
  COLOR_MODE_COOKIE_MAX_AGE,
} from "@/lib/color-mode";
import { getBrandingService } from "@/server/branding/runtime";
import { getServerConfig } from "@/server/config";
import { getFileService } from "@/server/files/runtime";
import { updateColorModePreference } from "@/server/settings/preferences";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

type BrandingAsset = "darkLogo" | "favicon" | "lightLogo";
type Branding = ReturnType<ReturnType<typeof getBrandingService>["getPublic"]>;
type Actor = Awaited<ReturnType<typeof requireFreelancerBackend>>["actor"];

export async function saveAppearanceSettingsAction(formData: FormData) {
  const uploadedFileIds: string[] = [];
  let actorForCleanup: Actor | null = null;
  let brandingCommitted = false;

  try {
    const { actor } = await requireFreelancerBackend();
    actorForCleanup = actor;
    const primaryColor = cleanText(formData.get("primaryColor"))?.toUpperCase() ?? "";
    if (!/^#[0-9A-F]{6}$/.test(primaryColor)) {
      return { errorKey: "settings.appearance.errors.primaryColor" };
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
      primaryColor,
      ...(lightLogoFileId ? { lightLogoFileId } : {}),
      ...(darkLogoFileId ? { darkLogoFileId } : {}),
      ...(iconFileId ? { iconFileId } : {}),
    });
    brandingCommitted = true;
    deleteSupersededBrandingFiles(actor, current, updated);
    revalidateAppearance();
    return { success: true };
  } catch (error) {
    if (actorForCleanup && !brandingCommitted) {
      deleteBrandingFilesBestEffort(actorForCleanup, uploadedFileIds);
    }
    console.error("Appearance settings update failed", error);
    return { errorKey: "settings.appearance.errors.saveFailed" };
  }
}

export async function saveColorModeAction(colorMode: string) {
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
    console.error("Color mode update failed", error);
    return { errorKey: "settings.appearance.errors.colorMode" };
  }
}

export async function removeAppearanceAssetAction(asset: BrandingAsset) {
  try {
    const { actor } = await requireFreelancerBackend();
    const fieldByAsset = {
      lightLogo: "lightLogoFileId",
      darkLogo: "darkLogoFileId",
      favicon: "iconFileId",
    } as const;
    if (!(asset in fieldByAsset)) {
      return { errorKey: "settings.appearance.errors.invalidAsset" };
    }
    const brandingService = getBrandingService();
    const current = brandingService.getPublic();
    const updated = brandingService.update(actor, { [fieldByAsset[asset]]: null });
    deleteSupersededBrandingFiles(actor, current, updated);
    revalidateAppearance();
    return { success: true };
  } catch (error) {
    console.error("Branding asset removal failed", error);
    return { errorKey: "settings.appearance.errors.removeFailed" };
  }
}

async function uploadBrandingFile(
  formData: FormData,
  field: BrandingAsset,
  kind: "branding_icon" | "branding_logo",
  actor: Actor,
) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  return getFileService().upload(actor, {
    kind,
    originalName: file.name,
    claimedMimeType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
  }).id;
}

function deleteSupersededBrandingFiles(actor: Actor, previous: Branding, next: Branding) {
  const activeFileIds = new Set(
    [next.lightLogoFileId, next.darkLogoFileId, next.iconFileId]
      .filter((id): id is string => Boolean(id)),
  );
  deleteBrandingFilesBestEffort(
    actor,
    [previous.lightLogoFileId, previous.darkLogoFileId, previous.iconFileId],
    activeFileIds,
  );
}

function deleteBrandingFilesBestEffort(
  actor: Actor,
  fileIds: Array<string | null>,
  exceptIds: ReadonlySet<string> = new Set(),
) {
  const ids = new Set(fileIds.filter((id): id is string => Boolean(id && !exceptIds.has(id))));
  for (const fileId of ids) {
    try {
      getFileService().delete(actor, fileId);
    } catch {
      // The DB update is authoritative. Orphan cleanup can be retried.
    }
  }
}

function revalidateAppearance() {
  revalidatePath("/", "layout");
  revalidatePath("/settings/appearance");
  revalidatePath("/portal", "layout");
  revalidatePath("/manifest.webmanifest");
}
