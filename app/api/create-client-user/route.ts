import { NextResponse } from "next/server";
import {
  createPortalInvitation,
  PortalInvitationError,
} from "@/server/auth/invitations";
import { getSessionContextFromHeaders } from "@/server/auth/session";

/**
 * Compatibility adapter for the current client detail screen.
 * It issues a one-time Better Auth invitation and never accepts a password.
 */
export async function POST(request: Request) {
  const actor = await getSessionContextFromHeaders(new Headers(request.headers));

  if (!actor) {
    return NextResponse.json({ error: "clients.detail.portalInviteUnauthenticated" }, { status: 401 });
  }

  try {
    const { email, client_id: clientId, locale } = await request.json();
    const invitation = await createPortalInvitation(actor, { email, clientId, locale });

    return NextResponse.json({ success: true, invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "clients.detail.invalidRequest" }, { status: 400 });
    }
    if (error instanceof PortalInvitationError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "INVALID_INPUT" ? 400 : 409;
      return NextResponse.json({ error: invitationErrorKey(error.code), code: error.code }, { status });
    }

    console.error("Client invitation adapter failed", error);
    return NextResponse.json({ error: "clients.detail.portalInviteFailed" }, { status: 500 });
  }
}

function invitationErrorKey(code: PortalInvitationError["code"]) {
  switch (code) {
    case "FORBIDDEN":
      return "clients.detail.portalInviteForbidden";
    case "INVALID_INPUT":
      return "clients.detail.portalInviteInvalid";
    default:
      return "clients.detail.portalInviteFailed";
  }
}
