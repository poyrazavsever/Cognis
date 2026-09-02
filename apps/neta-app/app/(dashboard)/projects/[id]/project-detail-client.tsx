"use client";

import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import {
  completeProjectRecord,
  createProjectPlanningSectionRecord,
  deleteProjectPlanningSectionRecord,
  updateProjectPlanningSectionRecord,
} from "@/app/(dashboard)/projects/actions";
import {
  createTaskRecord,
  updateTaskStatusRecord,
} from "@/app/(dashboard)/tasks/actions";
import { LocalizedFields, type LocalizedFieldLocale, type LocalizedFieldValues } from "@/components/i18n/localized-fields";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { PendingLink } from "@/components/ui/pending-link";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
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
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  KanbanSquare,
  LayoutList,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Settings2,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useState, useTransition, type DragEvent } from "react";

export type ProjectDetail = {
  id: string;
  client_id: string | null;
  clientName: string | null;
  name: string;
  type: "client_project" | "side_project";
  description: string | null;
  status: "planning" | "active" | "paused" | "completed" | "cancelled";
  start_date: string | null;
  due_date: string | null;
  budget_amount: number | null;
  currency: string;
  progress: number;
  progress_type: "manual" | "auto";
  revision_quota: number;
  cover_image_alt: string | null;
  coverImageUrl: string | null;
  translations?: LocalizedFieldValues;
};

export type ProjectPlanningSectionItem = {
  id: string;
  project_id: string;
  category:
    | "overview"
    | "problem"
    | "goal"
    | "audience"
    | "scope"
    | "design_system"
    | "color_palette"
    | "typography"
    | "assets"
    | "notes";
  title: string;
  content: string | null;
  sort_order: number;
  translations?: LocalizedFieldValues;
};

export type ProjectDetailTaskItem = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_at: string | null;
  is_public_to_client: boolean;
  translations?: LocalizedFieldValues;
};

export type ProjectFinanceItem = {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  payment_status: "planned" | "pending" | "paid" | "cancelled";
  transaction_date: string;
  category: string | null;
};

export type ProjectRevisionItem = {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  created_at: string;
  requested_by: string;
};

type ProjectDetailClientProps = {
  project: ProjectDetail;
  sections: ProjectPlanningSectionItem[];
  tasks: ProjectDetailTaskItem[];
  financeTransactions: ProjectFinanceItem[];
  revisions: ProjectRevisionItem[];
  localization: {
    defaultLocale: string;
    locales: LocalizedFieldLocale[];
  };
};

const statusClasses = {
  planning: "border-blue-200 bg-blue-50 text-blue-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-zinc-200 bg-zinc-50 text-zinc-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const priorityClasses = {
  low: "border-zinc-200 bg-zinc-50 text-zinc-700",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
};

const sectionCategoryOptions: ProjectPlanningSectionItem["category"][] = [
  "overview",
  "problem",
  "goal",
  "audience",
  "scope",
  "design_system",
  "color_palette",
  "typography",
  "assets",
  "notes",
];

const planningCategories: ProjectPlanningSectionItem["category"][] = [
  "overview",
  "problem",
  "goal",
  "audience",
  "scope",
  "notes",
];

const designCategories: ProjectPlanningSectionItem["category"][] = [
  "design_system",
  "color_palette",
  "typography",
  "assets",
];

export function ProjectDetailClient({
  project,
  sections,
  tasks,
  financeTransactions,
  revisions,
  localization,
}: ProjectDetailClientProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<"planning" | "design" | "tasks" | "finance" | "revisions">(
    "planning",
  );
  const planningSections = sections.filter((section) =>
    planningCategories.includes(section.category),
  );
  const designSections = sections.filter((section) =>
    designCategories.includes(section.category),
  );
  const doneTaskCount = tasks.filter((task) => task.status === "done").length;
  const incomeTotal = financeTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenseTotal = financeTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Button size="sm" effect="shine" asChild variant="secondary" className="gap-2 px-0 text-muted-foreground">
            <PendingLink href="/projects" className="flex items-center gap-2" showSpinner>
              <ArrowLeft className="h-4 w-4" />
              {t("projects.detail.backToProjects")}
            </PendingLink>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-normal text-foreground">
                {project.name}
              </h1>
              <Badge className={statusClasses[project.status]}>
                {t(`projects.status.${project.status}`)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <ProjectSettingsDialog project={project} />
          <SectionDialog projectId={project.id} mode="create" defaultCategory="overview" localization={localization} />
          {project.status !== "completed" ? (
            <form action={completeProjectRecord}>
              <input type="hidden" name="id" value={project.id} />
              <PendingSubmitButton
                variant="secondary"
                className="gap-2"
                idleIcon={<CheckCircle2 className="h-4 w-4" />}
                pendingChildren={t("projects.detail.completing")}
              >
                {t("projects.detail.complete")}
              </PendingSubmitButton>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardContent className="p-0">
            {project.coverImageUrl ? (
              <div className="relative aspect-[16/7] overflow-hidden rounded-t-sm border-b border-border bg-muted">
                <Image
                  src={project.coverImageUrl}
                  alt={project.cover_image_alt || project.name}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/7] items-center justify-center rounded-t-sm border-b border-dashed border-border bg-muted/30 text-muted-foreground">
                {t("projects.card.noCover")}
              </div>
            )}
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <InfoItem label={t("projects.detail.type")} value={t(`projects.types.${project.type}`)} icon={FolderKanban} />
              <InfoItem
                label={t("projects.detail.client")}
                value={project.clientName || t("projects.detail.independent")}
                icon={Target}
              />
              <InfoItem
                label={t("projects.detail.deadline")}
                value={project.due_date ? formatDate(project.due_date) : t("projects.detail.noDeadline")}
                icon={CalendarDays}
              />
              <InfoItem
                label={t("projects.detail.budget")}
                value={
                  project.budget_amount
                    ? formatCurrency(project.budget_amount, project.currency)
                    : t("projects.detail.noBudget")
                }
                icon={Wallet}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <StatCard label={t("projects.detail.progressLabel")} value={`${project.progress}%`} icon={Target} />
          <StatCard label={t("projects.detail.taskLabel")} value={`${doneTaskCount}/${tasks.length}`} icon={ClipboardList} />
          <StatCard
            label={t("projects.detail.netFinance")}
            value={formatCurrency(incomeTotal - expenseTotal, project.currency)}
            icon={Wallet}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-sm border border-border p-1">
        <TabButton active={activeTab === "planning"} onClick={() => setActiveTab("planning")}>
          {t("projects.detail.planning")}
        </TabButton>
        <TabButton active={activeTab === "design"} onClick={() => setActiveTab("design")}>
          {t("projects.detail.designSystem")}
        </TabButton>
        <TabButton active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")}>
          {t("projects.detail.tasks")}
        </TabButton>
        <TabButton active={activeTab === "finance"} onClick={() => setActiveTab("finance")}>
          {t("projects.detail.finance")}
        </TabButton>
        <TabButton active={activeTab === "revisions"} onClick={() => setActiveTab("revisions")}>
          {t("projects.detail.revisions")}
          {revisions.filter(r => r.status === 'pending').length > 0 && (
            <Badge variant="secondary" className="ml-2 px-1 py-0 h-4 text-[10px]">
              {revisions.filter(r => r.status === 'pending').length}
            </Badge>
          )}
        </TabButton>
      </div>

      {activeTab === "planning" ? (
        <SectionGrid
          projectId={project.id}
          title={t("projects.detail.planningTitle")}
          description={t("projects.detail.planningDesc")}
          sections={planningSections}
          defaultCategory="overview"
          localization={localization}
        />
      ) : null}

      {activeTab === "design" ? (
        <SectionGrid
          projectId={project.id}
          title={t("projects.detail.designTitle")}
          description={t("projects.detail.designDesc")}
          sections={designSections}
          defaultCategory="design_system"
          localization={localization}
        />
      ) : null}

      {activeTab === "tasks" ? (
        <TaskPanel projectId={project.id} clientId={project.client_id} tasks={tasks} localization={localization} />
      ) : null}
      {activeTab === "finance" ? <FinancePanel transactions={financeTransactions} /> : null}
      {activeTab === "revisions" ? <RevisionsPanel projectId={project.id} revisions={revisions} /> : null}
    </div>
  );
}

function RevisionsPanel({
  projectId,
  revisions,
}: {
  projectId: string;
  revisions: ProjectRevisionItem[];
}) {
  const t = useTranslations();
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(
    id: string,
    status: ProjectRevisionItem["status"],
  ) {
    setIsUpdating(true);
    try {
      const { updateRevisionStatus } = await import("@/app/(dashboard)/projects/actions");
      await updateRevisionStatus(id, projectId, status);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Revizyon durumu güncellenemedi.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">{t("projects.detail.revisionsTitle")}</h2>
        {revisions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("projects.detail.revisionsEmpty")}</p>
        ) : (
          <div className="space-y-4">
            {revisions.map(rev => (
              <div key={rev.id} className="p-4 border rounded-md">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-sm text-muted-foreground">
                    {new Date(rev.created_at).toLocaleString(getDocumentIntlLocale())}
                  </div>
                  <Select
                    defaultValue={rev.status}
                    onValueChange={(value) =>
                      handleStatusChange(
                        rev.id,
                        value as ProjectRevisionItem["status"],
                      )
                    }
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t("projects.status.pending")}</SelectItem>
                      <SelectItem value="in_progress">{t("projects.status.in_progress")}</SelectItem>
                      <SelectItem value="completed">{t("projects.status.completed")}</SelectItem>
                      <SelectItem value="rejected">{t("projects.status.rejected")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm whitespace-pre-wrap">{rev.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionGrid({
  projectId,
  title,
  description,
  sections,
  defaultCategory,
  localization,
}: {
  projectId: string;
  title: string;
  description: string;
  sections: ProjectPlanningSectionItem[];
  defaultCategory: ProjectPlanningSectionItem["category"];
  localization: ProjectDetailClientProps["localization"];
}) {
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <SectionDialog projectId={projectId} mode="create" defaultCategory={defaultCategory} localization={localization} />
        </div>

        {sections.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <PlanningSectionCard key={section.id} section={section} localization={localization} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-8 text-center">
            <FileText className="h-9 w-9 text-muted-foreground" />
            <h3 className="mt-4 text-base font-semibold text-foreground">{t("projects.detail.noRecords")}</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {t("projects.detail.noRecordsDesc")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanningSectionCard({
  section,
  localization,
}: {
  section: ProjectPlanningSectionItem;
  localization: ProjectDetailClientProps["localization"];
}) {
  const t = useTranslations();
  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge>{t(`projects.sections.${section.category}`)}</Badge>
            <h3 className="mt-3 text-base font-semibold text-foreground">{section.title}</h3>
          </div>
          <div className="flex gap-2">
            <SectionDialog projectId={section.project_id} mode="edit" section={section} localization={localization} />
            <form action={deleteProjectPlanningSectionRecord}>
              <input type="hidden" name="id" value={section.id} />
              <input type="hidden" name="project_id" value={section.project_id} />
              <PendingSubmitButton
                variant="secondary"
                className="px-3 text-rose-600"
                idleIcon={<Trash2 className="h-4 w-4" />}
                aria-label={t("projects.detail.delete")}
              />
            </form>
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {section.content || t("projects.detail.noContent")}
        </p>
      </CardContent>
    </Card>
  );
}

function SectionDialog({
  projectId,
  mode,
  defaultCategory,
  section,
  localization,
}: {
  projectId: string;
  mode: "create" | "edit";
  defaultCategory?: ProjectPlanningSectionItem["category"];
  section?: ProjectPlanningSectionItem;
  localization: ProjectDetailClientProps["localization"];
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action =
    mode === "create"
      ? createProjectPlanningSectionRecord
      : updateProjectPlanningSectionRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      await action(formData);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine"
          variant={mode === "create" ? "default" : "secondary"}
          className="gap-2 px-3"
        >
          {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {mode === "create" ? t("projects.detail.addPlan") : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="project_id" value={projectId} />
          {section ? <input type="hidden" name="id" value={section.id} /> : null}
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? t("projects.detail.planCreateTitle") : t("projects.detail.planEditTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("projects.detail.planDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("projects.detail.category")}</Label>
              <Select name="category" defaultValue={section?.category || defaultCategory || "overview"}>
                <SelectTrigger>
                  <SelectValue placeholder={t("projects.detail.categorySelect")} />
                </SelectTrigger>
                <SelectContent>
                  {sectionCategoryOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`projects.sections.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <LocalizedFields
              idPrefix={`section-${section?.id || "new"}`}
              defaultLocale={localization.defaultLocale}
              locales={localization.locales}
              fields={contentTranslationRegistry.planning_section.map((field) => ({
                ...field,
                label: t(`projects.detail.planFields.${field.name}`),
                placeholder: "placeholder" in field && typeof field.placeholder === "string"
                  ? t(`projects.detail.planPlaceholders.${field.name}`)
                  : undefined,
              }))}
              values={section?.translations}
              fallbackValues={{
                title: section?.title,
                content: section?.content,
              }}
            />
            <div className="grid gap-2">
              <Label htmlFor={`section-order-${section?.id || "new"}`}>{t("projects.detail.sortOrder")}</Label>
              <Input
                id={`section-order-${section?.id || "new"}`}
                name="sort_order"
                type="number"
                defaultValue={section?.sort_order ?? 0}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? t("projects.detail.saving") : t("projects.detail.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskPanel({
  projectId,
  clientId,
  tasks,
  localization,
}: {
  projectId: string;
  clientId: string | null;
  tasks: ProjectDetailTaskItem[];
  localization: ProjectDetailClientProps["localization"];
}) {
  const t = useTranslations();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [statusOverrides, setStatusOverrides] = useState<
    Partial<Record<string, ProjectDetailTaskItem["status"]>>
  >({});
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const localTasks = tasks.map((task) => ({
    ...task,
    status: statusOverrides[task.id] ?? task.status,
  }));

  function handleTaskStatusChange(taskId: string, status: ProjectDetailTaskItem["status"]) {
    const previousStatus = localTasks.find((task) => task.id === taskId)?.status;

    setPendingTask(taskId, true);
    setStatusOverrides((current) => ({ ...current, [taskId]: status }));

    startTransition(() => {
      void updateTaskStatusRecord(taskId, status, projectId)
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
              : t("projects.detail.taskUpdateFailed"),
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

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("projects.detail.tasksTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("projects.detail.tasksDesc")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex rounded-sm border border-border p-1">
              <Button size="sm" effect="shine"
                type="button"
                variant={view === "list" ? "default" : "secondary"}
                className="gap-2 px-3"
                onClick={() => setView("list")}
              >
                <LayoutList className="h-4 w-4" />
                {t("projects.detail.list")}
              </Button>
              <Button size="sm" effect="shine"
                type="button"
                variant={view === "kanban" ? "default" : "secondary"}
                className="gap-2 px-3"
                onClick={() => setView("kanban")}
              >
                <KanbanSquare className="h-4 w-4" />
                {t("projects.detail.kanban")}
              </Button>
            </div>
            <ProjectTaskDialog projectId={projectId} clientId={clientId} localization={localization} />
          </div>
        </div>

        {localTasks.length > 0 && view === "list" ? (
          <div className="overflow-hidden rounded-sm border border-border">
            <div className="hidden grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground lg:grid">
              <span>{t("projects.detail.colTask")}</span>
              <span>{t("projects.detail.colPriority")}</span>
              <span>{t("projects.detail.colDue")}</span>
              <span className="text-right">{t("projects.detail.colAction")}</span>
            </div>
            <div className="divide-y divide-border">
              {localTasks.map((task) => (
                <div
                  key={task.id}
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr] lg:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={
                          task.status === "done"
                            ? "font-medium text-muted-foreground line-through"
                            : "font-medium text-foreground"
                        }
                      >
                        {task.title}
                      </div>
                      {task.is_public_to_client && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">{t("projects.detail.taskPublic")}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t(`projects.status.${task.status}`)}
                    </div>
                  </div>
                  <div>
                    <Badge className={priorityClasses[task.priority]}>{t(`tasks.priority.${task.priority}`)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {task.due_at ? formatDateTime(task.due_at) : t("projects.detail.taskNone")}
                  </div>
                  <div className="flex justify-start lg:justify-end">
                    {task.status !== "done" ? (
                      <Button effect="shine"
                        type="button"
                        variant="secondary"
                        disabled={pendingTaskIds.has(task.id)}
                        aria-busy={pendingTaskIds.has(task.id)}
                        className="gap-2 px-3"
                        onClick={() => handleTaskStatusChange(task.id, "done")}
                      >
                        {pendingTaskIds.has(task.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {pendingTaskIds.has(task.id) ? t("projects.detail.completing") : t("projects.detail.complete")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {localTasks.length > 0 && view === "kanban" ? (
          <ProjectTaskKanban
            tasks={localTasks}
            pendingTaskIds={pendingTaskIds}
            onTaskStatusChange={handleTaskStatusChange}
          />
        ) : null}

        {localTasks.length === 0 ? (
          <EmptyPanel icon={ClipboardList} title={t("projects.detail.noTasks")} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProjectTaskKanban({
  tasks,
  pendingTaskIds,
  onTaskStatusChange,
}: {
  tasks: ProjectDetailTaskItem[];
  pendingTaskIds: Set<string>;
  onTaskStatusChange: (taskId: string, status: ProjectDetailTaskItem["status"]) => void;
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

  function handleDrop(status: ProjectDetailTaskItem["status"]) {
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
              <h3 className="text-sm font-semibold text-foreground">
                {t(`projects.status.${status}`)}
              </h3>
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
                        {task.due_at ? formatDateTime(task.due_at) : t("projects.detail.noDeadline")}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={priorityClasses[task.priority]}>{t(`tasks.priority.${task.priority}`)}</Badge>
                      {task.status !== "done" ? (
                        <Button
                          size="icon-sm"
                          effect="shine"
                          type="button"
                          variant="secondary"
                          disabled={pendingTaskIds.has(task.id)}
                          aria-busy={pendingTaskIds.has(task.id)}
                          title={t("projects.detail.complete")}
                          aria-label={t("projects.detail.complete")}
                          onClick={() => onTaskStatusChange(task.id, "done")}
                        >
                          {pendingTaskIds.has(task.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
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

function ProjectSettingsDialog({ project }: { project: ProjectDetail }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressType, setProgressType] = useState<"manual" | "auto">(project.progress_type);
  const [progress, setProgress] = useState(project.progress);
  const [revisionQuota, setRevisionQuota] = useState(project.revision_quota);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const { updateProjectSettings } = await import("@/app/(dashboard)/projects/actions");
      await updateProjectSettings(project.id, progressType, progress, revisionQuota);
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine" variant="secondary" className="gap-2 px-3">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">{t("projects.detail.settings")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t("projects.detail.settingsTitle")}</DialogTitle>
            <DialogDescription>
              {t("projects.detail.settingsDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("projects.detail.progressType")}</Label>
              <Select value={progressType} onValueChange={(val: "manual" | "auto") => setProgressType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t("projects.detail.progressManual")}</SelectItem>
                  <SelectItem value="auto">{t("projects.detail.progressAuto")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {progressType === "manual" && (
              <div className="grid gap-2">
                <Label>{t("projects.detail.progressValue")}</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-12 text-right text-sm font-medium">{progress}%</span>
                </div>
              </div>
            )}
            {progressType === "auto" && (
              <p className="text-xs text-muted-foreground">{t("projects.detail.progressAutoHint")}</p>
            )}

            <div className="grid gap-2">
              <Label>{t("projects.detail.revisionQuota")}</Label>
              <Input
                type="number"
                min="0"
                value={revisionQuota}
                onChange={(e) => setRevisionQuota(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">{t("projects.detail.revisionQuotaHint")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("projects.detail.saving") : t("projects.detail.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function ProjectTaskDialog({
  projectId,
  clientId,
  localization,
}: {
  projectId: string;
  clientId: string | null;
  localization: ProjectDetailClientProps["localization"];
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      await createTaskRecord(formData);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" effect="shine" className="gap-2 px-3">
          <Plus className="h-4 w-4" />
          {t("projects.detail.addTask")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="project_id" value={projectId} />
          {clientId ? <input type="hidden" name="client_id" value={clientId} /> : null}
          <DialogHeader>
            <DialogTitle>{t("projects.detail.addTaskTitle")}</DialogTitle>
            <DialogDescription>
              {t("projects.detail.addTaskDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <LocalizedFields
              idPrefix="project-task"
              defaultLocale={localization.defaultLocale}
              locales={localization.locales}
              fields={contentTranslationRegistry.task.map((field) => ({
                ...field,
                label: t(`tasks.fields.${field.name}`),
                placeholder: "placeholder" in field && typeof field.placeholder === "string"
                  ? t(`tasks.placeholders.${field.name}`)
                  : undefined,
              }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("projects.form.status")}</Label>
                <Select name="status" defaultValue="todo">
                  <SelectTrigger>
                    <SelectValue placeholder={t("projects.form.statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{t("projects.status.todo")}</SelectItem>
                    <SelectItem value="in_progress">{t("projects.status.in_progress")}</SelectItem>
                    <SelectItem value="done">{t("projects.status.done")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("projects.detail.colPriority")}</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder={t("tasks.form.priorityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("tasks.priority.low")}</SelectItem>
                    <SelectItem value="medium">{t("tasks.priority.medium")}</SelectItem>
                    <SelectItem value="high">{t("tasks.priority.high")}</SelectItem>
                    <SelectItem value="urgent">{t("tasks.priority.urgent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 border rounded-md p-4 bg-muted/20">
              <input 
                type="checkbox" 
                id="is_public_to_client" 
                name="is_public_to_client" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="is_public_to_client"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("projects.detail.publicToClient")}
                </label>
                <p className="text-[13px] text-muted-foreground">
                  {t("projects.detail.publicToClientHint")}
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="project-task-due">{t("projects.detail.colDue")}</Label>
                <Input id="project-task-due" name="due_at" type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-task-estimated">{t("projects.detail.estimatedTime")}</Label>
                <Input
                  id="project-task-estimated"
                  name="estimated_minutes"
                  type="number"
                  min="0"
                  placeholder={t("projects.detail.minutes")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-task-actual">{t("projects.detail.actualTime")}</Label>
                <Input
                  id="project-task-actual"
                  name="actual_minutes"
                  type="number"
                  min="0"
                  placeholder={t("projects.detail.minutes")}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="gap-2">
              <Plus className="h-4 w-4" />
              {isSubmitting ? t("projects.detail.saving") : t("projects.detail.submitTask")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FinancePanel({ transactions }: { transactions: ProjectFinanceItem[] }) {
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("projects.detail.financeTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("projects.detail.financeDesc")}
          </p>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-border rounded-sm border border-border">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium text-foreground">
                    {transaction.category || (transaction.type === "income" ? t("projects.detail.income") : t("projects.detail.expense"))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(transaction.transaction_date)} · {transaction.payment_status}
                  </div>
                </div>
                <div
                  className={
                    transaction.type === "income"
                      ? "font-semibold text-emerald-700"
                      : "font-semibold text-rose-700"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanel icon={Wallet} title={t("projects.detail.noFinance")} />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
}: {
  icon: typeof ClipboardList;
  title: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-8 text-center">
      <Icon className="h-9 w-9 text-muted-foreground" />
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof FolderKanban;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/20 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-background text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Palette;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button effect="shine"
      type="button"
      variant={active ? "default" : "secondary"}
      className="px-4"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// Removed function since it's localized inline now or no longer needed

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat(getDocumentIntlLocale(), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
