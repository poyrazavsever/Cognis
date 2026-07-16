import { apiError, apiSuccess } from "@/server/api/responses";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { DomainError } from "@/server/domain/errors";
import { fileKinds, type FileKind } from "@/server/domain/types";
import { getFileService } from "@/server/files/runtime";
import { MAX_UPLOAD_BYTES } from "@/server/files/policy";

export async function POST(request: Request) {
  const context = await getSessionContextFromHeaders(new Headers(request.headers));
  if (!context) return apiError(new DomainError("UNAUTHENTICATED", "Oturum gerekli."));

  try {
    const formData = await request.formData();
    const upload = formData.get("file");
    const rawKind = formData.get("kind");
    if (!(upload instanceof File) || typeof rawKind !== "string" || !isFileKind(rawKind)) {
      throw new DomainError("VALIDATION_ERROR", "file ve geçerli kind alanları zorunludur.");
    }
    if (upload.size > MAX_UPLOAD_BYTES) {
      throw new DomainError("VALIDATION_ERROR", "Dosya boyutu 5 MB sınırını aşıyor.");
    }

    const stored = getFileService().upload(domainActorFromSession(context), {
      kind: rawKind,
      originalName: upload.name,
      claimedMimeType: upload.type,
      bytes: new Uint8Array(await upload.arrayBuffer()),
      projectId: stringValue(formData.get("projectId")),
      portalVisible: formData.get("portalVisible") === "true",
    });

    return apiSuccess(toFileResponse(stored), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

function isFileKind(value: string): value is FileKind {
  return fileKinds.includes(value as FileKind);
}

function stringValue(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toFileResponse(file: ReturnType<ReturnType<typeof getFileService>["upload"]>) {
  return {
    id: file.id,
    kind: file.kind,
    visibility: file.visibility,
    originalName: file.originalName,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    sha256: file.sha256,
    projectId: file.projectId,
    url: `/api/files/${file.id}`,
    createdAt: file.createdAt,
  };
}
