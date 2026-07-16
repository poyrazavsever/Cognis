import { ClientsClient, type ClientListItem } from "@/app/(dashboard)/clients/clients-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function ClientsPage() {
  const { actor, service } = await requireFreelancerBackend();
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
    };
  });

  return (
    <ClientsClient
      clients={clients}
      totalRevenue={clients.reduce((sum, client) => sum + client.revenueTotal, 0)}
      activeCount={clients.filter((client) => client.status === "active").length}
      pausedCount={clients.filter((client) => client.status === "paused").length}
      archivedCount={clients.filter((client) => client.status === "archived").length}
    />
  );
}
