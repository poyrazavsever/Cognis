import { apiError, apiSuccess } from "@/server/api/responses";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { getBrandingService, getPublicBranding } from "@/server/branding/runtime";
import { DomainError } from "@/server/domain/errors";

export function GET() {
  return apiSuccess(getPublicBranding());
}

export async function PATCH(request: Request) {
  const context = await getSessionContextFromHeaders(new Headers(request.headers));
  if (!context) return apiError(new DomainError("UNAUTHENTICATED", "Oturum gerekli."));

  try {
    const branding = getBrandingService().update(
      domainActorFromSession(context),
      await request.json(),
    );
    return apiSuccess(branding);
  } catch (error) {
    return apiError(error);
  }
}
