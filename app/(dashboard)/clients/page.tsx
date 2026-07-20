import { ClientsClient, type ClientListItem } from "@/app/(dashboard)/clients/clients-client";
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

export default async function ClientsPage() {
  const { context, actor, service } = await requireFreelancerBackend();
  const resolvedLocale = await resolveFreelancerLocale(context);
  const payload = getClientI18nPayload(resolvedLocale.locale, ["clients"]);
  const activeLocales = service.listLocales(actor).filter(l => l.status !== "archived").map(l => ({ code: l.code, name: l.nativeName }));

  const clientsData = service.listClients(actor);
  const projects = service.listProjects(actor);
  const finance = service.listFinanceTransactions(actor);
  const activities = service.listAllClientActivities(actor);

  const projectCountByClient = new Map<string, number>();
  for (const project of projects) {
    if (project.clientId) {
      projectCountByClient.set(project.clientId, (projectCountByClient.get(project.clientId) ?? 0) + 1);
    }
  }

  const revenueByClient = new Map<string, number>();
  for (const transaction of finance) {
    if (transaction.clientId && transaction.type === "income" && transaction.paymentStatus === "paid") {
      revenueByClient.set(
        transaction.clientId,
        (revenueByClient.get(transaction.clientId) ?? 0) + transaction.amountMinor / 100,
      );
    }
  }

  const lastActivityByClient = new Map<string, Date>();
  for (const activity of activities) {
    if (!lastActivityByClient.has(activity.clientId)) {
      lastActivityByClient.set(activity.clientId, activity.activityDate);
    }
  }

  const translationsMap = service.contentTranslations.listBatch("client", clientsData.map(c => c.id));

  const clients: ClientListItem[] = clientsData.map((client) => {
    return {
      id: client.id,
      name: client.name,
      company_name: client.companyName,
      email: client.email,
      phone: client.phone,
      website: client.website,
      status: client.status,
      notes: client.notes,
      pipeline_stage: client.pipelineStage,
      next_follow_up_date: client.nextFollowUpDate,
      last_contact_date: lastActivityByClient.get(client.id)?.toISOString() ?? null,
      client_value_score: 0,
      created_at: client.createdAt.toISOString(),
      projectCount: projectCountByClient.get(client.id) ?? 0,
      revenueTotal: revenueByClient.get(client.id) ?? 0,
      translations: buildTranslations(translationsMap.get(client.id)),
    };
  });

  return (
    <I18nProvider payload={payload}>
      <ClientsClient
        clients={clients}
        totalRevenue={clients.reduce((sum, client) => sum + client.revenueTotal, 0)}
        activeCount={clients.filter((client) => client.status === "active").length}
        activeLocales={activeLocales}
      />
    </I18nProvider>
  );
}
