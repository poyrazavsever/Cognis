import { NextResponse } from "next/server";
import {
  createPortalInvitation,
  PortalInvitationError,
} from "@/server/auth/invitations";
import { getSessionContextFromHeaders } from "@/server/auth/session";

export async function POST(request: Request) {
  const actor = await getSessionContextFromHeaders(new Headers(request.headers));

  if (!actor) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const invitation = await createPortalInvitation(actor, {
      clientId: body.clientId,
      email: body.email,
      expiresInHours: body.expiresInHours,
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
    }
    return invitationErrorResponse(error);
  }
}

function invitationErrorResponse(error: unknown) {
  if (error instanceof PortalInvitationError) {
    const status =
      error.code === "FORBIDDEN"
        ? 403
        : error.code === "INVALID_INPUT"
          ? 400
          : error.code === "CLIENT_NOT_FOUND"
            ? 404
            : 409;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }

  console.error("Portal invitation create failed", error);
  return NextResponse.json({ error: "Davet oluşturulamadı." }, { status: 500 });
}
