import { TasksClient, type TaskListItem, type TaskRelationOption } from "@/app/(dashboard)/tasks/tasks-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function TasksPage() {
  const { actor, service } = await requireFreelancerBackend();
  const taskRows = service.listTasks(actor);
  const clientRows = service.listClients(actor);
  const projectRows = service.listProjects(actor);
  const clientNames = new Map(clientRows.map((item) => [item.id, item.name]));
  const projectNames = new Map(projectRows.map((item) => [item.id, item.name]));

  const tasks: TaskListItem[] = taskRows
    .filter((task) => task.status !== "cancelled")
    .map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as TaskListItem["status"],
      priority: task.priority,
      due_at: task.dueAt?.toISOString() ?? null,
      estimated_minutes: task.estimatedMinutes,
      actual_minutes: task.actualMinutes,
      client_id: task.clientId,
      clientName: task.clientId ? clientNames.get(task.clientId) ?? null : null,
      project_id: task.projectId,
      projectName: task.projectId ? projectNames.get(task.projectId) ?? null : null,
      created_at: task.createdAt.toISOString(),
    }));
  const clients: TaskRelationOption[] = clientRows
    .filter((client) => client.status !== "archived")
    .map(({ id, name }) => ({ id, name }));
  const projects: TaskRelationOption[] = projectRows
    .filter((project) => project.status !== "cancelled")
    .map(({ id, name, clientId }) => ({ id, name, client_id: clientId }));

  return <TasksClient tasks={tasks} clients={clients} projects={projects} />;
}
