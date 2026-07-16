import { DashboardClient, type DashboardData } from "./dashboard-client";
import { parseDashboardRange, resolveDashboardRange } from "@/server/services/analytics-range";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export const metadata = { title: "Dashboard - Neta" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const { actor, service } = await requireFreelancerBackend();
  const result = service.getFreelancerDashboard(actor, resolveDashboardRange(range));

  const data: DashboardData = {
    metrics: result.metrics,
    projects: result.projects.map((project) => ({
      id: project.id,
      status: project.status,
      name: project.name,
      created_at: project.createdAt.toISOString(),
    })),
    clients: result.clients.map((client) => ({
      id: client.id,
      name: client.name,
      company_name: client.companyName ?? "",
      created_at: client.createdAt.toISOString(),
    })),
    range,
  };

  return <DashboardClient data={data} />;
}
