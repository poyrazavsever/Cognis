"use client";

import { useState } from "react";
import { Card, CardContent, Badge, Button, Textarea, Label } from "poyraz-ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "poyraz-ui/molecules";
import { CheckCircle2, Clock, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { createRevisionRequest } from "./actions";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { formatDate, formatDateTime } from "@/lib/i18n/format";

export type PortalProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "paused" | "completed" | "cancelled";
  progress: number;
  due_date: string | null;
  revision_quota: number;
  can_request_revision: boolean;
};

export type PortalPlanningSection = {
  id: string;
  title: string;
  content: string | null;
  type: string;
};

export type PortalTask = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  date: string | null;
};

export type PortalRevision = {
  id: string;
  description: string;
  source_locale: string | null;
  status: "pending" | "in_progress" | "completed" | "rejected";
  created_at: string;
};

type PortalProjectClientProps = {
  project: PortalProjectDetail;
  sections: PortalPlanningSection[];
  tasks: PortalTask[];
  revisions: PortalRevision[];
  locale: string;
};

export function PortalProjectClient({
  project,
  sections,
  tasks,
  revisions,
  locale,
}: PortalProjectClientProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openRevision, setOpenRevision] = useState(false);

  async function handleRevision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await createRevisionRequest(project.id, formData);
      if (response.errorKey) throw new Error(response.errorKey);
      toast.success(t("portal.revision.success"));
      setOpenRevision(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? t(error.message) : t("portal.revision.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const pendingRevisions = revisions.filter(
    (revision) => revision.status === "pending" || revision.status === "in_progress",
  ).length;
  const hasRevisionQuota = project.can_request_revision;
  const number = new Intl.NumberFormat(locale);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          {project.description ? (
            <p className="max-w-3xl text-sm text-muted-foreground">{project.description}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1 text-sm capitalize">
              {projectStatusLabel(project.status, t)}
            </Badge>
            {hasRevisionQuota ? (
              <Dialog open={openRevision} onOpenChange={setOpenRevision}>
                <DialogTrigger asChild>
                  <Button variant="default" effect="shine" className="shrink-0 gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {t("portal.actions.requestRevision")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleRevision}>
                    <DialogHeader>
                      <DialogTitle>{t("portal.revision.title")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {pendingRevisions > 0 ? (
                        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-600">
                          {t("portal.revision.pendingWarning", { count: pendingRevisions })}
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        <Label htmlFor="revision-description">{t("portal.revision.descriptionLabel")}</Label>
                        <Textarea
                          id="revision-description"
                          name="description"
                          required
                          rows={5}
                          placeholder={t("portal.revision.descriptionPlaceholder")}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button effect="shine" type="button" variant="secondary" onClick={() => setOpenRevision(false)}>
                        {t("portal.actions.cancel")}
                      </Button>
                      <Button variant="default" effect="shine" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t("portal.actions.sendRequest")}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="default" effect="shine" disabled className="shrink-0 gap-2 opacity-50">
                <RefreshCw className="h-4 w-4" />
                {t("portal.actions.noRevisionQuota")}
              </Button>
            )}
          </div>
          {project.due_date ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {t("portal.labels.delivery")}: {formatDate(project.due_date, locale)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="overview" className="rounded-none px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            {t("portal.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="plan" className="rounded-none px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            {t("portal.tabs.plan")}
          </TabsTrigger>
          <TabsTrigger value="revisions" className="flex items-center gap-2 rounded-none px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            {t("portal.tabs.revisions")}
            {pendingRevisions > 0 ? (
              <Badge variant="secondary" className="flex h-5 min-w-5 items-center justify-center px-1.5 py-0">
                {pendingRevisions}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-5">
                <h3 className="font-semibold">{t("portal.sections.progress")}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-3xl font-bold">
                    <span>{t("portal.labels.percent", { value: number.format(project.progress) })}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${project.progress}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("portal.labels.progress")}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("portal.sections.doneTasks")}
                </h3>
                {tasks.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">{t("portal.empty.tasks")}</p>
                ) : (
                  <ul className="tiny-scrollbar max-h-60 space-y-3 overflow-y-auto pr-2">
                    {tasks.map((task) => (
                      <li key={task.id} className="flex gap-3 rounded p-2 text-sm transition-colors hover:bg-muted/30">
                        {task.status === "done" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        <div>
                          <span className={task.status === "done" ? "text-muted-foreground" : "font-medium text-foreground"}>
                            {task.title}
                          </span>
                          {task.date ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatDate(task.date, locale)}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          {sections.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
              {t("portal.empty.plan")}
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{section.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {t(`portal.planTypes.${section.type}`)}
                      </Badge>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{section.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="revisions" className="mt-6">
          <div className="mb-4 flex items-center justify-end">
            <div className="rounded-md bg-muted/50 px-3 py-1.5 text-sm font-medium text-muted-foreground">
              {t("portal.labels.remainingQuota")}:
              <span className="ml-1 text-foreground">
                {project.revision_quota !== null ? number.format(project.revision_quota) : t("portal.labels.unlimited")}
              </span>
            </div>
          </div>

          {revisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              <p>{t("portal.empty.revisions")}</p>
              {hasRevisionQuota ? (
                <Button effect="shine" variant="secondary" size="sm" onClick={() => setOpenRevision(true)}>
                  {t("portal.actions.newRequest")}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((revision) => (
                <Card key={revision.id} className="transition-colors hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(revision.created_at, locale)}
                      </div>
                      <Badge
                        variant={revision.status === "completed" ? "default" : revision.status === "rejected" ? "destructive" : "secondary"}
                        className="capitalize"
                      >
                        {revisionStatusLabel(revision.status, t)}
                      </Badge>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{revision.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function projectStatusLabel(status: PortalProjectDetail["status"], t: ReturnType<typeof useTranslations>) {
  if (status === "completed") return t("portal.status.project.completed");
  if (status === "active") return t("portal.status.project.active");
  return t("portal.status.project.waiting");
}

function revisionStatusLabel(status: PortalRevision["status"], t: ReturnType<typeof useTranslations>) {
  if (status === "pending") return t("portal.status.revision.pending");
  if (status === "in_progress") return t("portal.status.revision.inProgress");
  if (status === "completed") return t("portal.status.revision.completed");
  return t("portal.status.revision.rejected");
}
