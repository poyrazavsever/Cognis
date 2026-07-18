import { NextResponse } from "next/server";
import {
  acceptPortalInvitation,
  PortalInvitationError,
} from "@/server/auth/invitations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await acceptPortalInvitation({
      token: body.token,
      displayName: body.displayName,
      password: body.password,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
    }
    if (error instanceof PortalInvitationError) {
      const status = error.code === "INVALID_INPUT" ? 400 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("Portal invitation accept failed", error);
    return NextResponse.json({ error: "Portal hesabı oluşturulamadı." }, { status: 500 });
  }
}
