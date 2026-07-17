import { getNetaDiscoveryDocument } from "@/server/api/v1/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return Response.json(getNetaDiscoveryDocument(), {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Neta discovery failed", error);
    return Response.json(
      {
        protocol: "neta",
        discoveryVersion: 1,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Instance keşif bilgisi geçici olarak kullanılamıyor.",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
