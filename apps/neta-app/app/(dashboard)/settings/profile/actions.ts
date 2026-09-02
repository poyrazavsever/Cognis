"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/auth";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSqliteConnection } from "@/server/db/client";
import { appProfiles } from "@/server/db/schema";
import { getFileService } from "@/server/files/runtime";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

export async function updateProfileAction(formData: FormData) {
  try {
    const { context } = await requireFreelancerBackend();
    const firstName = cleanText(formData.get("firstName"));
    const lastName = cleanText(formData.get("lastName"));
    if (!firstName || firstName.length > 80) {
      return { errorKey: "settings.profile.errors.firstName" };
    }
    if (!lastName || lastName.length > 120) {
      return { errorKey: "settings.profile.errors.lastName" };
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
    const avatarChanged = avatar instanceof File && avatar.size > 0;
    if (avatarChanged) {
      getFileService().upload(domainActorFromSession(context), {
        kind: "avatar",
        originalName: avatar.name,
        claimedMimeType: avatar.type,
        bytes: new Uint8Array(await avatar.arrayBuffer()),
      });
    }

    revalidatePath("/", "layout");
    revalidatePath("/settings/profile");
    return { success: true, avatarChanged };
  } catch (error) {
    console.error("Profile update failed", error);
    return { errorKey: "settings.profile.errors.updateFailed" };
  }
}
