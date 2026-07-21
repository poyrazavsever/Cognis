"use client";

import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { useTranslations } from "@/components/i18n/i18n-provider";
import {
  createTaskRecord,
  deleteTaskRecord,
  updateTaskStatusRecord,
  updateTaskRecord,
} from "@/app/(dashboard)/tasks/actions";
import { LocalizedFields, type LocalizedFieldLocale, type LocalizedFieldValues } from "@/components/i18n/localized-fields";
import { contentTranslationRegistry } from "@/lib/i18n/content";
import { Badge, Button, Card, CardContent, Input, Label } from "poyraz-ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "poyraz-ui/molecules";
import {
  CheckCircle2,
  KanbanSquare,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useTransition, type DragEvent } from "react";

export type TaskRelationOption = {
  id: string;
  name: string;
  client_id?: string | null;
};

export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_at: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  client_id: string | null;
  clientName: string | null;
  project_id: string | null;
  projectName: string | null;
  created_at: string;
  translations?: LocalizedFieldValues;
};

const statusLabels = {
  todo: "Yapılacak",
  in_progress: "Devam ediyor",
  done: "Tamamlandı",
};

const priorityLabels = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

const priorityClasses = {
  low: "border-zinc-200 bg-zinc-50 text-zinc-700",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
};

type TasksClientProps = {
  tasks: TaskListItem[];
  clients: TaskRelationOption[];
  projects: TaskRelationOption[];
  localization: {
    defaultLocale: string;
    locales: LocalizedFieldLocale[];
  };
};

export function TasksClient({ tasks, clients, projects, localization }: TasksClientProps) {
  const t = useTranslations();
  const [statusOverrides, setStatusOverrides] = useState<
    Partial<Record<string, TaskListItem["status"]>>
  >({});
  const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("__all");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const localTasks = tasks
    .filter((task) => !deletedTaskIds.has(task.id))
    .map((task) => ({
      ...task,
      status: statusOverrides[task.id] ?? task.status,
    }));

  function handleTaskStatusChange(taskId: string, status: TaskListItem["status"]) {
    const previousStatus = localTasks.find((task) => task.id === taskId)?.status;

    setPendingTask(taskId, true);
    setStatusOverrides((current) => ({ ...current, [taskId]: status }));

    startTransition(() => {
      void updateTaskStatusRecord(taskId, status)
        .catch((error) => {
          setStatusOverrides((current) => {
            const next = { ...current };
            if (previousStatus) next[taskId] = previousStatus;
            else delete next[taskId];
            return next;
          });
          toast.error(
            error instanceof Error
              ? error.message
              : t("tasks.messages.updateFailed") || "Görev durumu güncellenemedi.",
          );
        })
        .finally(() => {
          setPendingTask(taskId, false);
        });
    });
  }

  function handleTaskDelete(taskId: string) {
    const task = localTasks.find((item) => item.id === taskId);
    const formData = new FormData();
    formData.set("id", taskId);

    if (task?.project_id) {
      formData.set("project_id", task.project_id);
    }

    setPendingTask(taskId, true);
    setDeletedTaskIds((current) => new Set(current).add(taskId));

    startTransition(() => {
      void deleteTaskRecord(formData)
        .catch((error) => {
          setDeletedTaskIds((current) => {
            const next = new Set(current);
            next.delete(taskId);
            return next;
          });
          toast.error(
            error instanceof Error ? error.message : "Görev silinemedi.",
          );
        })
        .finally(() => {
          setPendingTask(taskId, false);
        });
    });
  }

  function setPendingTask(taskId: string, pending: boolean) {
    setPendingTaskIds((current) => {
      const next = new Set(current);

      if (pending) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }

      return next;
    });
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredByProject =
    projectFilter === "__all"
      ? localTasks
      : projectFilter === "__none"
        ? localTasks.filter((task) => !task.project_id)
        : localTasks.filter((task) => task.project_id === projectFilter);
  const filteredTasks = normalizedQuery
    ? filteredByProject.filter((task) =>
        [task.title, task.description, task.clientName, task.projectName]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
      )
    : filteredByProject;

  const doneCount = localTasks.filter((task) => task.status === "done").length;
  const overdueCount = localTasks.filter((task) => isOverdue(task)).length;
  const urgentCount = localTasks.filter((task) => task.priority === "urgent").length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            {t("tasks.title")}
          </h1>
        </div>

        <TaskDialog mode="create" clients={clients} projects={projects} localization={localization} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label={t("tasks.stats.total")} value={localTasks.length.toString()} />
        <StatCard label={t("tasks.stats.completed")} value={doneCount.toString()} />
        <StatCard label={t("tasks.stats.overdue")} value={overdueCount.toString()} />
        <StatCard label={t("tasks.stats.urgent")} value={urgentCount.toString()} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">{t("tasks.list.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("tasks.list.showing", { count: filteredTasks.length.toString() })}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("tasks.list.search")}
                className="sm:w-80"
              />
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue placeholder={t("tasks.list.filterProject")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">{t("tasks.list.allProjects")}</SelectItem>
                  <SelectItem value="__none">{t("tasks.list.noProject")}</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex rounded-sm border border-border p-1">
                <Button size="sm" effect="shine"
                  type="button"
                  variant={view === "list" ? "default" : "secondary"}
                  className="gap-2 px-3"
                  onClick={() => setView("list")}
                >
                  <LayoutList className="h-4 w-4" />
                  {t("tasks.list.viewList")}
                </Button>
                <Button size="sm" effect="shine"
                  type="button"
                  variant={view === "kanban" ? "default" : "secondary"}
                  className="gap-2 px-3"
                  onClick={() => setView("kanban")}
                >
                  <KanbanSquare className="h-4 w-4" />
                  {t("tasks.list.viewKanban")}
                </Button>
              </div>
            </div>
          </div>

          {filteredTasks.length > 0 ? (
            view === "list" ? (
              <TaskList
                tasks={filteredTasks}
                clients={clients}
                projects={projects}
                localization={localization}
                pendingTaskIds={pendingTaskIds}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
              />
            ) : (
              <TaskKanban
                tasks={filteredTasks}
                clients={clients}
                projects={projects}
                localization={localization}
                pendingTaskIds={pendingTaskIds}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
              />
            )
          ) : (
            <EmptyState hasQuery={Boolean(normalizedQuery)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TaskList({
  tasks,
  clients,
  projects,
  localization,
  pendingTaskIds,
  onTaskDelete,
  onTaskStatusChange,
}: {
  tasks: TaskListItem[];
  clients: TaskRelationOption[];
  projects: TaskRelationOption[];
  localization: TasksClientProps["localization"];
  pendingTaskIds: Set<string>;
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: TaskListItem["status"]) => void;
}) {
  const t = useTranslations();
  return (
    <div className="overflow-x-auto rounded-sm border border-border">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
          <span>{t("tasks.col.task")}</span>
          <span>{t("tasks.col.relation")}</span>
          <span>{t("tasks.col.priority")}</span>
          <span>{t("tasks.col.due")}</span>
          <span className="text-right">{t("tasks.col.action")}</span>
        </div>
        <div className="divide-y divide-border">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            clients={clients}
            projects={projects}
            localization={localization}
            isPending={pendingTaskIds.has(task.id)}
            onTaskDelete={onTaskDelete}
            onTaskStatusChange={onTaskStatusChange}
          />
        ))}
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  clients,
  projects,
  localization,
  isPending,
  onTaskDelete,
  onTaskStatusChange,
}: {
  task: TaskListItem;
  clients: TaskRelationOption[];
  projects: TaskRelationOption[];
  localization: TasksClientProps["localization"];
  isPending: boolean;
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: TaskListItem["status"]) => void;
}) {
  const t = useTranslations();
  return (
    <div className="grid gap-4 px-4 py-4 grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr] items-center">
      <div className="min-w-0">
        <div className={task.status === "done" ? "font-medium text-muted-foreground line-through" : "font-medium text-foreground"}>
          {task.title}
        </div>
        <div className="truncate text-sm text-muted-foreground">
          {t(`tasks.status.${task.status}`)}
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        <div>{task.projectName || t("tasks.row.noProject")}</div>
        <div>{task.clientName || t("tasks.row.noClient")}</div>
      </div>
      <div>
        <Badge className={priorityClasses[task.priority]}>
          {t(`tasks.priority.${task.priority}`)}
        </Badge>
      </div>
      <div className={isOverdue(task) ? "text-sm font-medium text-rose-600" : "text-sm text-muted-foreground"}>
        {task.due_at ? formatDateTime(task.due_at) : t("tasks.row.noDue")}
      </div>
      <TaskActions
        task={task}
        clients={clients}
        projects={projects}
        localization={localization}
        isPending={isPending}
        onTaskDelete={onTaskDelete}
        onTaskStatusChange={onTaskStatusChange}
      />
    </div>
  );
}

function TaskKanban({
  tasks,
  clients,
  projects,
  localization,
  pendingTaskIds,
  onTaskDelete,
  onTaskStatusChange,
}: {
  tasks: TaskListItem[];
  clients: TaskRelationOption[];
  projects: TaskRelationOption[];
  localization: TasksClientProps["localization"];
  pendingTaskIds: Set<string>;
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: TaskListItem["status"]) => void;
}) {
  const t = useTranslations();
  const columns = ["todo", "in_progress", "done"] as const;
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  function handleDragStart(event: DragEvent<HTMLDivElement>, taskId: string) {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.setDragImage(event.currentTarget, 24, 24);
  }

  function handleDrop(status: TaskListItem["status"]) {
    if (!draggedTaskId) return;

    onTaskStatusChange(draggedTaskId, status);
    setDraggedTaskId(null);
  }

  return (
    <div className="tiny-scrollbar grid gap-4 overflow-x-auto pb-2 lg:grid-cols-3">
      {columns.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <div
            key={status}
            className="min-w-72 rounded-sm border border-border bg-muted/20 p-3 transition-colors"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={() => handleDrop(status)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{t(`tasks.status.${status}`)}</h3>
              <Badge>{columnTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <Card
                  key={task.id}
                  draggable
                  className={
                    draggedTaskId === task.id
                      ? "cursor-grabbing opacity-50 ring-2 ring-primary/20 transition"
                      : "cursor-grab transition hover:border-primary/30 active:cursor-grabbing"
                  }
                  onDragStart={(event) => handleDragStart(event, task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                >
                  <CardContent className="space-y-3 p-3">
                    <div>
                      <div className="font-medium text-foreground">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.projectName || task.clientName || t("tasks.col.relation")}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={priorityClasses[task.priority]}>
                        {t(`tasks.priority.${task.priority}`)}
                      </Badge>
                      <TaskActions
                        task={task}
                        clients={clients}
                        projects={projects}
                        localization={localization}
                        compact
                        isPending={pendingTaskIds.has(task.id)}
                        onTaskDelete={onTaskDelete}
                        onTaskStatusChange={onTaskStatusChange}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskActions({
  task,
  clients,
  projects,
  localization,
  compact = false,
  isPending,
  onTaskDelete,
  onTaskStatusChange,
}: {
  task: TaskListItem;
  clients: TaskRelationOption[];
  projects: TaskRelationOption[];
  localization: TasksClientProps["localization"];
  compact?: boolean;
  isPending: boolean;
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: TaskListItem["status"]) => void;
}) {
  const t = useTranslations();
  return (
    <div className={compact ? "flex justify-end gap-1" : "flex justify-start gap-2 lg:justify-end"}>
      <TaskDialog mode="edit" task={task} clients={clients} projects={projects} localization={localization} />
      {task.status !== "done" ? (
        <Button effect="shine"
          type="button"
          variant="secondary"
          disabled={isPending}
          aria-busy={isPending}
          className="min-w-24 gap-2 px-3"
          onClick={() => onTaskStatusChange(task.id, "done")}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {!compact ? (isPending ? t("projects.detail.completing") : t("projects.detail.complete")) : null}
        </Button>
      ) : null}
      <Button effect="shine"
        type="button"
        variant="secondary"
        disabled={isPending}
        aria-busy={isPending}
        className="gap-2 px-3 text-rose-600"
        onClick={() => onTaskDelete(task.id)}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function TaskDialog({
  mode,
  task,
  clients,
  projects,
  localization,
}: {
  mode: "create" | "edit";
  task?: TaskListItem;
  clients: TaskRelationOption[];
  projects: TaskRelationOption[];
  localization: TasksClientProps["localization"];
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = mode === "create" ? createTaskRecord : updateTaskRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      await action(formData);
      setOpen(false);
      toast.success(mode === "create" ? t("tasks.messages.added") : t("tasks.messages.updated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks.messages.saveFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine"
          variant={mode === "create" ? "default" : "secondary"}
          className="min-w-24 gap-2 px-3"
        >
          {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {mode === "create" ? t("tasks.form.add") : t("tasks.form.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(680px,calc(100dvh-4rem))] sm:max-w-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {task ? <input type="hidden" name="id" value={task.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>{mode === "create" ? t("tasks.form.createTitle") : t("tasks.form.editTitle")}</DialogTitle>
            <DialogDescription>
              {t("tasks.form.desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <TaskFormFields task={task} clients={clients} projects={projects} localization={localization} />
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
              {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {isSubmitting
                ? t("tasks.form.saving")
                : mode === "create"
                  ? t("tasks.form.submitAdd")
                  : t("tasks.form.submitEdit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskFormFields({
  task,
  clients,
  projects,
  localization,
}: {
  task?: TaskListItem;
  clients: TaskRelationOption[];
  projects: TaskRelationOption[];
  localization: TasksClientProps["localization"];
}) {
  const t = useTranslations();
  const [clientId, setClientId] = useState(task?.client_id || "__none");
  const [projectId, setProjectId] = useState(task?.project_id || "__none");
  const selectedProject =
    projectId === "__none" ? null : projects.find((project) => project.id === projectId) || null;
  const shouldLockClient = Boolean(selectedProject);
  const filteredProjects =
    clientId === "__none" || shouldLockClient
      ? projects
      : projects.filter((project) => project.client_id === clientId);

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId);

    if (
      projectId !== "__none" &&
      nextClientId !== "__none" &&
      !projects.some((project) => project.id === projectId && project.client_id === nextClientId)
    ) {
      setProjectId("__none");
    }
  }

  function handleProjectChange(nextProjectId: string) {
    setProjectId(nextProjectId);

    if (nextProjectId === "__none") {
      return;
    }

    const nextProject = projects.find((project) => project.id === nextProjectId);
    setClientId(nextProject?.client_id || "__none");
  }

  return (
    <div className="grid gap-4">
      <LocalizedFields
        idPrefix={`task-${task?.id || "new"}`}
        defaultLocale={localization.defaultLocale}
        locales={localization.locales}
        fields={contentTranslationRegistry.task.map((f: any) => ({ ...f, label: (t as any)(`tasks.fields.${f.name}`) || f.label, placeholder: f.placeholder ? (t as any)(`tasks.placeholders.${f.name}`) || f.placeholder : undefined }))}
        values={task?.translations}
        fallbackValues={{
          title: task?.title,
          description: task?.description,
        }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="status" label={t("tasks.form.status")} defaultValue={task?.status || "todo"}>
          <SelectItem value="todo">{t("tasks.status.todo")}</SelectItem>
          <SelectItem value="in_progress">{t("tasks.status.in_progress")}</SelectItem>
          <SelectItem value="done">{t("tasks.status.done")}</SelectItem>
        </SelectField>
        <SelectField name="priority" label={t("tasks.form.priority")} defaultValue={task?.priority || "medium"}>
          <SelectItem value="low">{t("tasks.priority.low")}</SelectItem>
          <SelectItem value="medium">{t("tasks.priority.medium")}</SelectItem>
          <SelectItem value="high">{t("tasks.priority.high")}</SelectItem>
          <SelectItem value="urgent">{t("tasks.priority.urgent")}</SelectItem>
        </SelectField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>{t("tasks.form.client")}</Label>
          {shouldLockClient ? <input type="hidden" name="client_id" value={clientId} /> : null}
          <Select
            name="client_id"
            value={clientId}
            onValueChange={handleClientChange}
            disabled={shouldLockClient}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("tasks.form.selectClient")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">{t("tasks.form.noClient")}</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t("tasks.form.project")}</Label>
          <Select name="project_id" value={projectId} onValueChange={handleProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("tasks.form.selectProject")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">{t("tasks.form.noProject")}</SelectItem>
              {filteredProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={`due-${task?.id || "new"}`}>{t("tasks.form.due")}</Label>
          <Input
            id={`due-${task?.id || "new"}`}
            name="due_at"
            type="datetime-local"
            defaultValue={task?.due_at ? toDateTimeLocal(task.due_at) : ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`estimated-${task?.id || "new"}`}>{t("tasks.form.estimated")}</Label>
          <Input
            id={`estimated-${task?.id || "new"}`}
            name="estimated_minutes"
            type="number"
            min="0"
            defaultValue={task?.estimated_minutes ?? ""}
            placeholder={t("tasks.form.minutes")}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`actual-${task?.id || "new"}`}>{t("tasks.form.actual")}</Label>
          <Input
            id={`actual-${task?.id || "new"}`}
            name="actual_minutes"
            type="number"
            min="0"
            defaultValue={task?.actual_minutes ?? ""}
            placeholder={t("tasks.form.minutes")}
          />
        </div>
      </div>
    </div>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger>
          <SelectValue placeholder={t("tasks.form.select", { label })} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  const t = useTranslations();
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-8 text-center">
      <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {hasQuery ? t("tasks.empty.noMatchTitle") : t("tasks.empty.noTaskTitle")}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasQuery
          ? t("tasks.empty.noMatchDesc")
          : t("tasks.empty.noTaskDesc")}
      </p>
    </div>
  );
}

function isOverdue(task: TaskListItem) {
  return Boolean(task.due_at && task.status !== "done" && new Date(task.due_at) < new Date());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}
