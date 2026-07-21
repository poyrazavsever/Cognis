import { requireFreelancerBackend } from "@/server/web/freelancer";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { InvoicesClient, type InvoiceRow } from "./invoices-client";

export default async function InvoicesPage() {
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const clientNames = new Map(service.listClients(actor).map((client) => [client.id, client.name]));
  const projectNames = new Map(service.listProjects(actor).map((project) => [project.id, project.name]));
  const invoices: InvoiceRow[] = service.listInvoices(actor).map((invoice) => ({
    id: invoice.id,
    invoice_number: invoice.invoiceNumber,
    amount: invoice.amountMinor / 100,
    currency: invoice.currency,
    status: invoice.status,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    created_at: invoice.createdAt.toISOString(),
    clientName: invoice.clientId ? clientNames.get(invoice.clientId) ?? null : null,
    projectName: invoice.projectId ? projectNames.get(invoice.projectId) ?? null : null,
  }));

  const i18nPayload = getClientI18nPayload(locale.locale, ["business", "common"]);

  return (
    <I18nProvider {...i18nPayload}>
      <InvoicesClient invoices={invoices} />
    </I18nProvider>
  );
}
