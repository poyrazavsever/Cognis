import { requireFreelancerBackend } from "@/server/web/freelancer";
import { InvoicesClient, type InvoiceRow } from "./invoices-client";

export default async function InvoicesPage() {
  const { actor, service } = await requireFreelancerBackend();
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

  return <InvoicesClient invoices={invoices} />;
}
