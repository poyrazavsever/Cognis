import { ProjectsClient, type ProjectClientOption, type ProjectListItem } from "@/app/(dashboard)/projects/projects-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function ProjectsPage() {
  const { actor, service } = await requireFreelancerBackend();
  const projectRows = service.listProjects(actor);
  const clientRows = service.listClients(actor);
  const taskRows = service.listTasks(actor);
  const clientNames = new Map(clientRows.map((client) => [client.id, client.name]));
  const taskStats = new Map<string, { total: number; done: number }>();

  for (const task of taskRows) {
    if (!task.projectId || task.status === "cancelled") continue;
    const stats = taskStats.get(task.projectId) ?? { total: 0, done: 0 };
    stats.total += 1;
    if (task.status === "done") stats.done += 1;
    taskStats.set(task.projectId, stats);
  }

  const projects: ProjectListItem[] = projectRows.map((project) => {
    const stats = taskStats.get(project.id) ?? { total: 0, done: 0 };
    return {
      id: project.id,
      client_id: project.clientId,
      clientName: project.clientId ? clientNames.get(project.clientId) ?? null : null,
      name: project.name,
      type: project.type,
      description: project.description,
      status: project.status,
      start_date: project.startDate,
      due_date: project.dueDate,
      budget_amount: project.budgetAmountMinor == null ? null : project.budgetAmountMinor / 100,
      currency: project.currency,
      progress: project.progress,
      cover_image_path: project.legacyCoverImagePath,
      cover_image_alt: project.coverImageAlt,
      coverImageUrl: project.legacyCoverImagePath,
      taskCount: stats.total,
      doneTaskCount: stats.done,
    };
  });
  const clients: ProjectClientOption[] = clientRows
    .filter((client) => client.status !== "archived")
    .sort((a, b) => a.name.localeCompare(b.name, "tr"))
    .map(({ id, name }) => ({ id, name }));

  return <ProjectsClient projects={projects} clients={clients} />;
}
