import { notFound } from "next/navigation";
import {
  ProjectDetailClient,
  type ProjectDetail,
  type ProjectDetailTaskItem,
  type ProjectFinanceItem,
  type ProjectPlanningSectionItem,
  type ProjectRevisionItem,
} from "@/app/(dashboard)/projects/[id]/project-detail-client";
import { DomainError } from "@/server/domain/errors";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actor, service } = await requireFreelancerBackend();

  let data: {
    project: ProjectDetail;
    sections: ProjectPlanningSectionItem[];
    tasks: ProjectDetailTaskItem[];
    financeTransactions: ProjectFinanceItem[];
    revisions: ProjectRevisionItem[];
  };
  try {
    const row = service.getProject(actor, id);
    const client = row.clientId ? service.getClient(actor, row.clientId) : null;
    const project: ProjectDetail = {
      id: row.id,
      client_id: row.clientId,
      clientName: client?.name ?? null,
      name: row.name,
      type: row.type,
      description: row.description,
      status: row.status,
      start_date: row.startDate,
      due_date: row.dueDate,
      budget_amount: row.budgetAmountMinor == null ? null : row.budgetAmountMinor / 100,
      currency: row.currency,
      progress: row.progress,
      progress_type: row.progressType,
      revision_quota: row.revisionQuota,
      cover_image_alt: row.coverImageAlt,
      coverImageUrl: row.legacyCoverImagePath,
    };
    const sections: ProjectPlanningSectionItem[] = service.listPlanningSections(actor, id).map((section) => ({
      id: section.id,
      project_id: section.projectId,
      category: section.category,
      title: section.title,
      content: section.content,
      sort_order: section.sortOrder,
    }));
    const tasks: ProjectDetailTaskItem[] = service.listTasks(actor, id)
      .filter((task) => task.status !== "cancelled")
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status as ProjectDetailTaskItem["status"],
        priority: task.priority,
        due_at: task.dueAt?.toISOString() ?? null,
        is_public_to_client: task.isPublicToClient,
      }));
    const financeTransactions: ProjectFinanceItem[] = service.listFinanceTransactions(actor)
      .filter((transaction) => transaction.projectId === id)
      .map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amountMinor / 100,
        currency: transaction.currency,
        payment_status: transaction.paymentStatus,
        transaction_date: transaction.transactionDate,
        category: transaction.category,
      }));
    const revisions = service.listRevisions(actor, id).map((revision) => ({
      id: revision.id,
      description: revision.description,
      status: revision.status,
      created_at: revision.createdAt.toISOString(),
      requested_by: revision.requestedByUserId,
    }));

    data = { project, sections, tasks, financeTransactions, revisions };
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <ProjectDetailClient
      project={data.project}
      sections={data.sections}
      tasks={data.tasks}
      financeTransactions={data.financeTransactions}
      revisions={data.revisions}
    />
  );
}
