import { apiV1Error, apiV1Success } from "@/server/api/v1/responses";
import { checkReadiness } from "@/server/db/health";
import { DomainError } from "@/server/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const readiness = checkReadiness();
  const checkedAt = new Date().toISOString();

  if (!readiness.ok) {
    return apiV1Error(
      new DomainError(
        "SERVICE_UNAVAILABLE",
        "Instance henüz isteklere hazır değil.",
        { checks: readiness.checks, checkedAt },
      ),
    );
  }

  return apiV1Success({
    status: "ok",
    checks: readiness.checks,
    checkedAt,
  });
}
