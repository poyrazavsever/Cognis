import { NextResponse } from "next/server";
import {
  PortalInvitationError,
  setClientPortalAccess,
} from "@/server/auth/invitations";
import { getSessionContextFromHeaders } from "@/server/auth/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const actor = await getSessionContextFromHeaders(new Headers(request.headers));

  if (!actor) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  try {
    const { enabled } = await request.json();

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled boolean olmalıdır." }, { status: 400 });
    }

    setClientPortalAccess(actor, (await params).clientId, enabled);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
    }
    if (error instanceof PortalInvitationError) {
      const status = error.code === "FORBIDDEN" ? 403 : 404;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("Client portal access update failed", error);
    return NextResponse.json({ error: "Portal erişimi güncellenemedi." }, { status: 500 });
  }
}
