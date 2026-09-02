import { apiError } from "@/server/api/responses";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { DomainError } from "@/server/domain/errors";
import { getFileService } from "@/server/files/runtime";
import { fileResponse } from "@/server/files/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getSessionContextFromHeaders(new Headers(request.headers));
  if (!context) return apiError(new DomainError("UNAUTHENTICATED", "Oturum gerekli."));

  try {
    const file = getFileService().read(domainActorFromSession(context), (await params).id);
    return fileResponse(file.metadata, file.bytes, "private, no-store");
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getSessionContextFromHeaders(new Headers(request.headers));
  if (!context) return apiError(new DomainError("UNAUTHENTICATED", "Oturum gerekli."));

  try {
    getFileService().delete(domainActorFromSession(context), (await params).id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
