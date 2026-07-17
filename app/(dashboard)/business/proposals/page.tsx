import { requireFreelancerBackend } from "@/server/web/freelancer";
import { ProposalsClient, type ProposalRow } from "./proposals-client";

export default async function ProposalsPage() {
  const { actor, service } = await requireFreelancerBackend();
  const clientNames = new Map(service.listClients(actor).map((client) => [client.id, client.name]));
  const projectNames = new Map(service.listProjects(actor).map((project) => [project.id, project.name]));
  const proposals: ProposalRow[] = service.listProposals(actor).map((proposal) => ({
    id: proposal.id,
    title: proposal.title,
    amount: proposal.amountMinor / 100,
    currency: proposal.currency,
    status: proposal.status,
    valid_until: proposal.validUntil?.toISOString() ?? null,
    created_at: proposal.createdAt.toISOString(),
    clientName: proposal.clientId ? clientNames.get(proposal.clientId) ?? null : null,
    projectName: proposal.projectId ? projectNames.get(proposal.projectId) ?? null : null,
  }));

  return <ProposalsClient proposals={proposals} />;
}
