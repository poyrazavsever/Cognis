import { NextResponse } from "next/server";
import {
  PortalInvitationError,
  revokePortalInvitation,
} from "@/server/auth/invitations";
import { getSessionContextFromHeaders } from "@/server/auth/session";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionContextFromHeaders(new Headers(request.headers));

  if (!actor) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const invitationId = Number((await params).id);

  if (!Number.isInteger(invitationId) || invitationId < 1) {
    return NextResponse.json({ error: "Geçersiz davet kimliği." }, { status: 400 });
  }

  try {
    revokePortalInvitation(actor, invitationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PortalInvitationError) {
      const status = error.code === "FORBIDDEN" ? 403 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("Portal invitation revoke failed", error);
    return NextResponse.json({ error: "Davet iptal edilemedi." }, { status: 500 });
  }
}
