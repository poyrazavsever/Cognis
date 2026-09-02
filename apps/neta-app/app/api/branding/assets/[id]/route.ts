import { apiError } from "@/server/api/responses";
import { getFileService } from "@/server/files/runtime";
import { fileResponse } from "@/server/files/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const file = getFileService().readPublicBranding((await params).id);
    return fileResponse(file.metadata, file.bytes, "public, max-age=3600, stale-while-revalidate=86400");
  } catch (error) {
    return apiError(error);
  }
}
