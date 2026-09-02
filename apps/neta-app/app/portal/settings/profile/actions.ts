"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/auth";
import { getSqliteConnection } from "@/server/db/client";
import { appProfiles } from "@/server/db/schema";
import { getFileService } from "@/server/files/runtime";
import { requirePortalBackend } from "@/server/web/portal";
import { cleanText } from "@/server/web/form-data";

export async function updatePortalProfileAction(formData: FormData) {
  try {
    const { actor, context } = await requirePortalBackend();
    const firstName = cleanText(formData.get("firstName"));
    const lastName = cleanText(formData.get("lastName"));
    if (!firstName || firstName.length > 80) {
      return { errorKey: "settings.profile.errors.firstName" };
    }
    if (!lastName || lastName.length > 120) {
      return { errorKey: "settings.profile.errors.lastName" };
    }

    const displayName = `${firstName} ${lastName}`;
    const avatar = formData.get("avatar");
    const avatarChanged = avatar instanceof File && avatar.size > 0;
    if (avatarChanged) {
      getFileService().upload(actor, {
        kind: "avatar",
        originalName: avatar.name,
        claimedMimeType: avatar.type,
        bytes: new Uint8Array(await avatar.arrayBuffer()),
      });
    }

    await auth.api.updateUser({
      headers: await headers(),
      body: { name: displayName },
    });
    getSqliteConnection().db
      .update(appProfiles)
      .set({ displayName, updatedAt: new Date() })
      .where(eq(appProfiles.authUserId, context.user.id))
      .run();

    revalidatePath("/", "layout");
    revalidatePath("/portal", "layout");
    revalidatePath("/portal/settings/profile");
    return { success: true, avatarChanged };
  } catch (error) {
    console.error("Portal profile update failed", error);
    return { errorKey: "settings.profile.errors.updateFailed" };
  }
}
