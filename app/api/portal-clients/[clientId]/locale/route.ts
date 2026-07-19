import { NextResponse } from "next/server";
import {
  PortalInvitationError,
  setClientPortalLocale,
} from "@/server/auth/invitations";
import { getSessionContextFromHeaders } from "@/server/auth/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const actor = await getSessionContextFromHeaders(new Headers(request.headers));

  if (!actor) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = setClientPortalLocale(actor, (await params).clientId, body.locale);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
    }
    if (error instanceof PortalInvitationError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "CLIENT_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("Client portal locale update failed", error);
    return NextResponse.json({ error: "Portal dili güncellenemedi." }, { status: 500 });
  }
}
