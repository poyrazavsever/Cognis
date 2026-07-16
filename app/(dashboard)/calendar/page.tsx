import { CalendarClient, type CalendarEventItem, type CalendarRelationOption, type CalendarTaskOption } from "@/app/(dashboard)/calendar/calendar-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function CalendarPage() {
  const { actor, service } = await requireFreelancerBackend();
  const eventRows = service.listCalendarEvents(actor);
  const clientRows = service.listClients(actor);
  const projectRows = service.listProjects(actor);
  const taskRows = service.listTasks(actor);
  const clients = new Map(clientRows.map((item) => [item.id, item.name]));
  const projects = new Map(projectRows.map((item) => [item.id, item.name]));
  const tasks = new Map(taskRows.map((item) => [item.id, item.title]));

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

  return <CalendarClient events={events} clients={clientOptions} projects={projectOptions} tasks={taskOptions} />;
}
