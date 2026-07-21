import { ProjectsClient, type ProjectClientOption, type ProjectListItem } from "@/app/(dashboard)/projects/projects-client";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, type ContentTranslationRow } from "@/server/i18n/content";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";

export default async function ProjectsPage() {
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const payload = getClientI18nPayload(locale.locale, ["projects", "common"]);
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getLocalizationContext(actor);
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

  const projectTranslations = content.listBatch("project", projectRows.map((project) => project.id));
  const projects: ProjectListItem[] = projectRows.map((project) => {
    const stats = taskStats.get(project.id) ?? { total: 0, done: 0 };
    const translationRows = projectTranslations.get(project.id) ?? [];
    const resolvedProject = content.resolveEntity("project", project, {
      locale: locale.locale,
      defaultLocale: localization.defaultLocale,
      translations: translationRows,
    });
    return {
      id: project.id,
      client_id: project.clientId,
      clientName: project.clientId ? clientNames.get(project.clientId) ?? null : null,
      name: resolvedProject.name,
      type: project.type,
      description: resolvedProject.description,
      status: project.status,
      start_date: project.startDate,
      due_date: project.dueDate,
      budget_amount: project.budgetAmountMinor == null ? null : project.budgetAmountMinor / 100,
      currency: project.currency,
      progress: project.progress,
      cover_image_path: project.legacyCoverImagePath,
      cover_image_alt: resolvedProject.coverImageAlt,
      coverImageUrl: project.legacyCoverImagePath,
      taskCount: stats.total,
      doneTaskCount: stats.done,
      translations: toLocalizedValues(translationRows),
    };
  });
  const clients: ProjectClientOption[] = clientRows
    .filter((client) => client.status !== "archived")
    .sort((a, b) => a.name.localeCompare(b.name, locale.locale))
    .map(({ id, name }) => ({ id, name }));

  const i18nPayload = await getClientI18nPayload(locale.locale, ["projects", "tasks", "common"]);

  return (
    <I18nProvider {...i18nPayload}>
      <ProjectsClient projects={projects} clients={clients} localization={localization} />
    </I18nProvider>
  );
}

function toLocalizedValues(rows: ContentTranslationRow[]) {
  return rows.reduce<Record<string, Record<string, string>>>((result, row) => {
    result[row.locale] = result[row.locale] ?? {};
    result[row.locale][row.field] = row.value;
    return result;
  }, {});
}
