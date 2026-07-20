"use server";

import { redirect } from "next/navigation";
import {
  acceptPortalInvitation,
  PortalInvitationError,
} from "@/server/auth/invitations";

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

  redirect("/login?code=auth.invite.success");
}
