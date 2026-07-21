import { DashboardClient, type DashboardData } from "./dashboard-client";
import { parseDashboardRange, resolveDashboardRange } from "@/server/services/analytics-range";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { requireFreelancer } from "@/server/auth/session";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const context = await requireFreelancer();
  const resolvedLocale = await resolveFreelancerLocale(context);
  const payload = getClientI18nPayload(resolvedLocale.locale, ["dashboard", "common"]);

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

  return (
    <I18nProvider locale={payload.locale} messages={payload.messages}>
      <DashboardClient data={data} />
    </I18nProvider>
  );
}
