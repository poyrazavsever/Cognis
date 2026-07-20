import { CalendarClient, type CalendarEventItem, type CalendarRelationOption, type CalendarTaskOption } from "@/app/(dashboard)/calendar/calendar-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getSqliteConnection } from "@/server/db/client";
import { I18nService } from "@/server/i18n/service";
import type { ContentTranslationRow } from "@/server/i18n/content";

function buildTranslations(rows: ContentTranslationRow[] | undefined) {
  if (!rows) return undefined;
  const result: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    if (!result[row.locale]) result[row.locale] = {};
    result[row.locale][row.field] = row.value;
  }
  return result;
}

export default async function CalendarPage() {
  const { context, actor, service } = await requireFreelancerBackend();
  const resolvedLocale = await resolveFreelancerLocale(context);
  const payload = getClientI18nPayload(resolvedLocale.locale, ["calendar"]);
  
  const i18n = new I18nService(getSqliteConnection().db);
  const activeLocales = i18n.listLocales(actor).filter(l => l.status !== "archived").map(l => ({ code: l.code, name: l.nativeName }));
  
  const eventRows = service.listCalendarEvents(actor);
  const clientRows = service.listClients(actor);
  const projectRows = service.listProjects(actor);
  const taskRows = service.listTasks(actor);
  const clients = new Map(clientRows.map((item) => [item.id, item.name]));
  const projects = new Map(projectRows.map((item) => [item.id, item.name]));
  const tasks = new Map(taskRows.map((item) => [item.id, item.title]));

  const translationsMap = service.contentTranslations.listBatch("calendar_event", eventRows.map(e => e.id));

  const events: CalendarEventItem[] = eventRows.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    starts_at: event.startsAt.toISOString(),
    ends_at: event.endsAt?.toISOString() ?? null,
    client_id: event.clientId,
    project_id: event.projectId,
    task_id: event.taskId,
    clientName: event.clientId ? clients.get(event.clientId) ?? null : null,
    projectName: event.projectId ? projects.get(event.projectId) ?? null : null,
    taskTitle: event.taskId ? tasks.get(event.taskId) ?? null : null,
    translations: buildTranslations(translationsMap.get(event.id)),
  }));
  const clientOptions: CalendarRelationOption[] = clientRows
    .filter((item) => item.status !== "archived")
    .map(({ id, name }) => ({ id, name }));
  const projectOptions: CalendarRelationOption[] = projectRows
    .filter((item) => item.status !== "cancelled")
    .map(({ id, name }) => ({ id, name }));
  const taskOptions: CalendarTaskOption[] = taskRows
    .filter((item) => item.status !== "done" && item.status !== "cancelled")
    .map(({ id, title }) => ({ id, title }));

  return (
    <I18nProvider payload={payload}>
      <CalendarClient events={events} clients={clientOptions} projects={projectOptions} tasks={taskOptions} activeLocales={activeLocales} />
    </I18nProvider>
  );
}
