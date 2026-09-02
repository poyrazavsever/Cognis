import { FinanceClient, type FinanceRelationOption, type FinanceTransactionItem } from "@/app/(dashboard)/finance/finance-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, type ContentTranslationRow } from "@/server/i18n/content";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";

export default async function FinancePage() {
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getLocalizationContext(actor);
  const rows = service.listFinanceTransactions(actor);
  const clientRows = service.listClients(actor);
  const projectRows = service.listProjects(actor);
  const clients = new Map(clientRows.map((item) => [item.id, item.name]));
  const projects = new Map(projectRows.map((item) => [item.id, item.name]));

  const transactionsTranslations = content.listBatch("finance_transaction", rows.map((transaction) => transaction.id));

  const transactions: FinanceTransactionItem[] = rows.map((transaction) => {
    const translationRows = transactionsTranslations.get(transaction.id) ?? [];
    const resolved = content.resolveEntity("finance_transaction", transaction, {
      locale: locale.locale,
      defaultLocale: localization.defaultLocale,
      translations: translationRows,
    });
    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amountMinor / 100,
      currency: transaction.currency,
      transaction_date: transaction.transactionDate,
      category: resolved.category,
      payment_status: transaction.paymentStatus,
      client_id: transaction.clientId,
      project_id: transaction.projectId,
      clientName: transaction.clientId ? clients.get(transaction.clientId) ?? null : null,
      projectName: transaction.projectId ? projects.get(transaction.projectId) ?? null : null,
      description: resolved.description,
      translations: toLocalizedValues(translationRows),
    };
  });
  const clientOptions: FinanceRelationOption[] = clientRows
    .filter((item) => item.status !== "archived")
    .map(({ id, name }) => ({ id, name }));
  const projectOptions: FinanceRelationOption[] = projectRows
    .filter((item) => item.status !== "cancelled")
    .map(({ id, name, clientId }) => ({ id, name, client_id: clientId }));

  const i18nPayload = await getClientI18nPayload(locale.locale, ["finance", "common"]);

  return (
    <I18nProvider {...i18nPayload}>
      <FinanceClient transactions={transactions} clients={clientOptions} projects={projectOptions} localization={localization} />
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
