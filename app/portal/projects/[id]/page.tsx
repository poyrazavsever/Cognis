import { notFound } from "next/navigation";
import { DomainError } from "@/server/domain/errors";
import { requirePortalBackend } from "@/server/web/portal";
import {
  PortalProjectClient,
  type PortalPlanningSection,
  type PortalProjectDetail,
  type PortalRevision,
  type PortalTask,
} from "./portal-project-client";

export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actor, service } = await requirePortalBackend();
  let data: {
    project: PortalProjectDetail;
    sections: PortalPlanningSection[];
    tasks: PortalTask[];
    revisions: PortalRevision[];
  };

  try {
    const row = service.getProject(actor, id);
    const allowance = service.getRevisionAllowance(actor, id);
    data = {
      project: {
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        progress: row.progress,
        due_date: row.dueDate,
        revision_quota: allowance.remaining,
        can_request_revision: allowance.canRequest,
      },
      sections: service.listPlanningSections(actor, id).map((section) => ({
        id: section.id,
        title: section.title,
        content: section.content,
        type: section.category,
      })),
      tasks: service.listTasks(actor, id)
        .filter((task) => task.status !== "cancelled")
        .map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status as PortalTask["status"],
          date: task.dueAt?.toISOString() ?? task.scheduledDate,
        })),
      revisions: service.listRevisions(actor, id).map((revision) => ({
        id: revision.id,
        description: revision.description,
        status: revision.status,
        created_at: revision.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <PortalProjectClient
      project={data.project}
      sections={data.sections}
      tasks={data.tasks}
      revisions={data.revisions}
    />
  );
}
