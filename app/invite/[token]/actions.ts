"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  acceptPortalInvitation,
  getPortalInvitationPreview,
  PortalInvitationError,
} from "@/server/auth/invitations";
import { buildLocaleCookie } from "@/server/i18n/locale";

function inviteErrorCode(error: unknown): string {
  if (!(error instanceof PortalInvitationError)) return "auth.messages.portalInviteFailed";
  if (error.code === "INVITATION_EXPIRED") return "auth.invite.expired";
  if (error.code === "INVITATION_NOT_PENDING") return "auth.invite.accepted";
  return "auth.messages.portalInviteFailed";
}

export async function acceptInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await acceptPortalInvitation({ token, displayName, password });
  } catch (error) {
    redirect(`/invite/${encodeURIComponent(token)}?error=true&code=${inviteErrorCode(error)}`);
  }

  const locale = getPortalInvitationPreview(token)?.locale ?? "tr";
  (await cookies()).set(buildLocaleCookie(locale));
  redirect("/login?code=auth.invite.success");
}
