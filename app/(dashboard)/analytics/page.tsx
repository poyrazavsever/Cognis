import { AnalyticsClient, type AnalyticsData } from "./analytics-client";
import { parseDashboardRange, resolveDashboardRange } from "@/server/services/analytics-range";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export const metadata = { title: "Analizler - Neta" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const { actor, service } = await requireFreelancerBackend();
  const metrics = service.getFreelancerAnalytics(actor, resolveDashboardRange(range));
  const data: AnalyticsData = { metrics, range };

  return <AnalyticsClient data={data} />;
}
