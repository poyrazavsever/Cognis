import { requireFreelancerBackend } from "@/server/web/freelancer";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, type ContentTranslationRow } from "@/server/i18n/content";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { ProposalsClient, type BusinessRelationOption, type ProposalRow } from "./proposals-client";

export default async function ProposalsPage() {
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getLocalizationContext(actor);
  const clientNames = new Map(service.listClients(actor).map((client) => [client.id, client.name]));
  const projectNames = new Map(service.listProjects(actor).map((project) => [project.id, project.name]));
  const rawProposals = service.listProposals(actor);
  const translations = content.listBatch("proposal", rawProposals.map((proposal) => proposal.id));
  const proposals: ProposalRow[] = rawProposals.map((proposal) => {
    const translationRows = translations.get(proposal.id) ?? [];
    const resolved = content.resolveEntity("proposal", proposal, {
      locale: locale.locale,
      defaultLocale: localization.defaultLocale,
      translations: translationRows,
    });

    return {
      id: proposal.id,
      title: resolved.title,
      description: resolved.description,
      amount: proposal.amountMinor / 100,
      currency: proposal.currency,
      status: proposal.status,
      valid_until: proposal.validUntil?.toISOString() ?? null,
      client_id: proposal.clientId,
      project_id: proposal.projectId,
      created_at: proposal.createdAt.toISOString(),
      clientName: proposal.clientId ? clientNames.get(proposal.clientId) ?? null : null,
      projectName: proposal.projectId ? projectNames.get(proposal.projectId) ?? null : null,
      translations: toLocalizedValues(translationRows),
    };
  });
  const clients: BusinessRelationOption[] = service.listClients(actor).map((client) => ({ id: client.id, name: client.name }));
  const projects: BusinessRelationOption[] = service.listProjects(actor).map((project) => ({ id: project.id, name: project.name, client_id: project.clientId }));
  const i18nPayload = getClientI18nPayload(locale.locale, ["business", "common"]);

  return (
    <I18nProvider {...i18nPayload}>
      <ProposalsClient proposals={proposals} clients={clients} projects={projects} localization={localization} />
    </I18nProvider>
  );
}

function toLocalizedValues(rows: ContentTranslationRow[]) {
  return rows.reduce<Record<string, Record<string, string>>>((result, row) => {
    result[row.locale] = result[row.locale] ?? {};
    result[row.locale][row.field] = row.value;
    return result;
  }, {});
}
