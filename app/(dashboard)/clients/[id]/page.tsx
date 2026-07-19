import { notFound } from "next/navigation";
import { ClientDetailClient, type ClientDetailData, type ClientActivity } from "./client-detail-client";
import { getSqliteConnection } from "@/server/db/client";
import { DomainError } from "@/server/domain/errors";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actor, service } = await requireFreelancerBackend();
  const i18n = new I18nService(getSqliteConnection().db);
  const locales = i18n.listLocales(actor).filter((locale) => locale.status === "active");
  const defaultLocale = i18n.getSettings(actor).defaultLocale;

  let data: { client: ClientDetailData; activities: ClientActivity[] };
  try {
    const row = service.getClient(actor, id);
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
    };
    const activities: ClientActivity[] = service.listClientActivities(actor, id).map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      content: activity.content,
      activity_date: activity.activityDate.toISOString(),
      created_at: activity.createdAt.toISOString(),
    }));

    data = { client, activities };
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return <ClientDetailClient client={data.client} activities={data.activities} locales={locales} />;
}
