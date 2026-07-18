"use server";

import { redirect } from "next/navigation";
import {
  acceptPortalInvitation,
  PortalInvitationError,
} from "@/server/auth/invitations";

export async function acceptInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await acceptPortalInvitation({ token, displayName, password });
  } catch (error) {
    const message =
      error instanceof PortalInvitationError
        ? error.message
        : "Portal hesabı oluşturulamadı.";
    redirect(`/invite/${encodeURIComponent(token)}?error=true&message=${encodeURIComponent(message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent("Portal hesabın oluşturuldu. Şimdi giriş yapabilirsin.")}`,
  );
}
