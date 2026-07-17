import { apiV1Error, apiV1Success } from "@/server/api/v1/responses";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { getServerConfig } from "@/server/config";
import { DomainError } from "@/server/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await getSessionContextFromHeaders(new Headers(request.headers));
    if (!context) {
      throw new DomainError("UNAUTHENTICATED", "Geçerli bir oturum gerekli.");
    }

    return apiV1Success({
      user: {
        id: context.user.id,
        email: context.profile.email,
        displayName: context.profile.displayName,
        role: context.profile.role,
        clientId: context.profile.clientId,
        imageUrl: absoluteOptionalUrl(context.user.image),
      },
      session: {
        expiresAt: context.session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    return apiV1Error(error);
  }
}

function absoluteOptionalUrl(value: string | null | undefined): string | null {
  return value ? new URL(value, `${getServerConfig().appUrl}/`).toString() : null;
}
