import { NextResponse } from "next/server";
import {
  PortalInvitationError,
  setClientPortalLocale,
} from "@/server/auth/invitations";
import { getSessionContextFromHeaders } from "@/server/auth/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const actor = await getSessionContextFromHeaders(new Headers(request.headers));

  if (!actor) {
    return NextResponse.json({ error: "clients.detail.portalLocaleUnauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = setClientPortalLocale(actor, (await params).clientId, body.locale);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "clients.detail.invalidRequest" }, { status: 400 });
    }
    if (error instanceof PortalInvitationError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "CLIENT_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: portalLocaleErrorKey(error.code), code: error.code }, { status });
    }

    console.error("Client portal locale update failed", error);
    return NextResponse.json({ error: "clients.detail.portalLocaleUpdateFailed" }, { status: 500 });
  }
}

function portalLocaleErrorKey(code: PortalInvitationError["code"]) {
  switch (code) {
    case "FORBIDDEN":
      return "clients.detail.portalLocaleForbidden";
    case "CLIENT_NOT_FOUND":
      return "clients.detail.portalLocaleClientNotFound";
    default:
      return "clients.detail.portalLocaleUpdateFailed";
  }
}
