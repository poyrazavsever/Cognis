import { apiV1Error, apiV1Success } from "@/server/api/v1/responses";
import { getNetaInstanceMetadata } from "@/server/api/v1/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return apiV1Success(getNetaInstanceMetadata(), {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return apiV1Error(error);
  }
}
