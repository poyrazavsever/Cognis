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
    return NextResponse.json({ error: "Müşteri daveti için giriş yapmalısınız." }, { status: 401 });
  }

  try {
    const { email, client_id: clientId } = await request.json();
    const invitation = await createPortalInvitation(actor, { email, clientId });

    return NextResponse.json({ success: true, invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
    }
    if (error instanceof PortalInvitationError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "INVALID_INPUT" ? 400 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("Client invitation adapter failed", error);
    return NextResponse.json({ error: "Müşteri daveti oluşturulamadı." }, { status: 500 });
  }
}
