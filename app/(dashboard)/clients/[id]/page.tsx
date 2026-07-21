import { notFound } from "next/navigation";
import { ClientDetailClient, type ClientDetailData, type ClientActivity } from "./client-detail-client";
import { getSqliteConnection } from "@/server/db/client";
import { DomainError } from "@/server/domain/errors";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import type { ContentTranslationRow } from "@/server/i18n/content";

function buildTranslations(rows: ContentTranslationRow[] | undefined) {
  if (!rows) return undefined;
  const result: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    if (!result[row.locale]) result[row.locale] = {};
    result[row.locale][row.field] = row.value;
  }
  return result;
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { context, actor, service } = await requireFreelancerBackend();
  const i18n = new I18nService(getSqliteConnection().db);
  const locales = i18n.listLocales(actor).filter((locale) => locale.status === "active");
  const defaultLocale = i18n.getSettings(actor).defaultLocale;
  
  const resolvedLocale = await resolveFreelancerLocale(context);
  const payload = getClientI18nPayload(resolvedLocale.locale, ["clients", "common"]);

  let data: { client: ClientDetailData; activities: ClientActivity[] };
  try {
    const row = service.getClient(actor, id);
    const clientTranslationsMap = service.contentTranslations.listBatch("client", [id]);
    
    const client: ClientDetailData = {
      id: row.id,
      name: row.name,
      company_name: row.companyName,
      email: row.email,
      phone: row.phone,
      website: row.website,
      pipeline_stage: row.pipelineStage,
      status: row.status,
      notes: row.notes,
      client_auth_id: row.authUserId,
      portal_locale: row.portalLocale ?? defaultLocale,
      translations: buildTranslations(clientTranslationsMap.get(id) ?? []),
    };
    
    const rawActivities = service.listClientActivities(actor, id);
    const activityTranslationsMap = service.contentTranslations.listBatch("client_activity", rawActivities.map(a => a.id));

    const activities: ClientActivity[] = rawActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      content: activity.content,
      activity_date: activity.activityDate.toISOString(),
      created_at: activity.createdAt.toISOString(),
      translations: buildTranslations(activityTranslationsMap.get(activity.id)),
    }));

    data = { client, activities };
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <I18nProvider {...payload}>
      <ClientDetailClient client={data.client} activities={data.activities} locales={locales} currentLocale={resolvedLocale.locale} />
    </I18nProvider>
  );
}
