import { TasksClient, type TaskListItem, type TaskRelationOption } from "@/app/(dashboard)/tasks/tasks-client";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, type ContentTranslationRow } from "@/server/i18n/content";
import { resolveRequestLocale } from "@/server/i18n/resolver";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function TasksPage() {
  const locale = await resolveRequestLocale();
  const { actor, service } = await requireFreelancerBackend();
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getLocalizationContext(actor);
  const taskRows = service.listTasks(actor);
  const clientRows = service.listClients(actor);
  const projectRows = service.listProjects(actor);
  const clientNames = new Map(clientRows.map((item) => [item.id, item.name]));
  const projectTranslations = content.listBatch("project", projectRows.map((project) => project.id));
  const resolvedProjects = projectRows.map((project) => content.resolveEntity("project", project, {
    locale: locale.locale,
    defaultLocale: localization.defaultLocale,
    translations: projectTranslations.get(project.id) ?? [],
  }));
  const projectNames = new Map(resolvedProjects.map((item) => [item.id, item.name]));

  const taskTranslations = content.listBatch("task", taskRows.map((task) => task.id));
  const tasks: TaskListItem[] = taskRows
    .filter((task) => task.status !== "cancelled")
    .map((task) => {
      const translationRows = taskTranslations.get(task.id) ?? [];
      const resolvedTask = content.resolveEntity("task", task, {
        locale: locale.locale,
        defaultLocale: localization.defaultLocale,
        translations: translationRows,
      });
      return {
        id: task.id,
        title: resolvedTask.title,
        description: resolvedTask.description,
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
        translations: toLocalizedValues(translationRows),
      };
    });
  const clients: TaskRelationOption[] = clientRows
    .filter((client) => client.status !== "archived")
    .map(({ id, name }) => ({ id, name }));
  const projects: TaskRelationOption[] = resolvedProjects
    .filter((project) => project.status !== "cancelled")
    .map(({ id, name, clientId }) => ({ id, name, client_id: clientId }));

  return <TasksClient tasks={tasks} clients={clients} projects={projects} localization={localization} />;
}

function toLocalizedValues(rows: ContentTranslationRow[]) {
  return rows.reduce<Record<string, Record<string, string>>>((result, row) => {
    result[row.locale] = result[row.locale] ?? {};
    result[row.locale][row.field] = row.value;
    return result;
  }, {});
}
