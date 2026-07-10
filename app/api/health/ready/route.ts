import { checkReadiness } from "@/server/db/health";

export const runtime = "nodejs";

export function GET() {
  const readiness = checkReadiness();

  return Response.json(
    {
      status: readiness.ok ? "ok" : "unhealthy",
      checks: readiness.checks,
      timestamp: new Date().toISOString(),
    },
    { status: readiness.ok ? 200 : 503 },
  );
}
