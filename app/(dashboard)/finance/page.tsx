import { FinanceClient, type FinanceRelationOption, type FinanceTransactionItem } from "@/app/(dashboard)/finance/finance-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function FinancePage() {
  const { actor, service } = await requireFreelancerBackend();
  const rows = service.listFinanceTransactions(actor);
  const clientRows = service.listClients(actor);
  const projectRows = service.listProjects(actor);
  const clients = new Map(clientRows.map((item) => [item.id, item.name]));
  const projects = new Map(projectRows.map((item) => [item.id, item.name]));

  const transactions: FinanceTransactionItem[] = rows.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amountMinor / 100,
    currency: transaction.currency,
    transaction_date: transaction.transactionDate,
    category: transaction.category,
    payment_status: transaction.paymentStatus,
    client_id: transaction.clientId,
    project_id: transaction.projectId,
    clientName: transaction.clientId ? clients.get(transaction.clientId) ?? null : null,
    projectName: transaction.projectId ? projects.get(transaction.projectId) ?? null : null,
    description: transaction.description,
  }));
  const clientOptions: FinanceRelationOption[] = clientRows
    .filter((item) => item.status !== "archived")
    .map(({ id, name }) => ({ id, name }));
  const projectOptions: FinanceRelationOption[] = projectRows
    .filter((item) => item.status !== "cancelled")
    .map(({ id, name, clientId }) => ({ id, name, client_id: clientId }));

  return <FinanceClient transactions={transactions} clients={clientOptions} projects={projectOptions} />;
}
