"use server";

import { redirect } from "next/navigation";
import {
  acceptPortalInvitation,
  PortalInvitationError,
} from "@/server/auth/invitations";

function inviteErrorCode(error: unknown): string {
  if (!(error instanceof PortalInvitationError)) return "auth.messages.portalInviteFailed";
  if (error.code === "INVALID_INPUT") return "auth.invite.invalidInput";
  if (error.code === "INVITATION_EXPIRED") return "auth.invite.expired";
  if (error.code === "INVITATION_NOT_FOUND") return "auth.invite.notFound";
  if (error.code === "INVITATION_NOT_PENDING") return "auth.invite.unavailable";
  if (error.code === "EMAIL_ALREADY_REGISTERED") return "auth.invite.emailRegistered";
  if (error.code === "CLIENT_ALREADY_LINKED") return "auth.invite.clientLinked";
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
