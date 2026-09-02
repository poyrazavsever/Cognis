"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/auth";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { cleanText } from "@/server/web/form-data";

export async function changePasswordAction(formData: FormData) {
  const currentPassword = cleanText(formData.get("currentPassword")) ?? "";
  const newPassword = cleanText(formData.get("newPassword")) ?? "";
  const confirmPassword = cleanText(formData.get("confirmPassword")) ?? "";

  if (!currentPassword) {
    return { errorKey: "settings.security.errors.currentRequired" };
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return { errorKey: "settings.security.errors.newLength" };
  }
  if (newPassword !== confirmPassword) {
    return { errorKey: "settings.security.errors.confirmMismatch" };
  }
  if (newPassword === currentPassword) {
    return { errorKey: "settings.security.errors.samePassword" };
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
    revalidatePath("/settings/security");
    return { success: true };
  } catch (error) {
    console.error("Password change failed", error);
    return { errorKey: "settings.security.errors.changeFailed" };
  }
}
