import { AnalyticsClient, type AnalyticsData } from "./analytics-client";
import { parseDashboardRange, resolveDashboardRange } from "@/server/services/analytics-range";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { requireFreelancer } from "@/server/auth/session";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";

export const metadata = { title: "Analizler" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const context = await requireFreelancer();
  const resolvedLocale = await resolveFreelancerLocale(context);
  const payload = getClientI18nPayload(resolvedLocale.locale, ["analytics"]);

  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const { actor, service } = await requireFreelancerBackend();
  const metrics = service.getFreelancerAnalytics(actor, resolveDashboardRange(range));
  const data: AnalyticsData = { metrics, range };

  return (
    <I18nProvider locale={payload.locale} messages={payload.messages}>
      <AnalyticsClient data={data} />
    </I18nProvider>
  );
}
