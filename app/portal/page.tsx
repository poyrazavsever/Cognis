import { Card, CardContent, Badge } from "poyraz-ui/atoms";
import { FolderKanban, CheckCircle2, Clock, BarChart } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/system/stat-card";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, getContentFallbackLocale } from "@/server/i18n/content";
import { formatDate } from "@/lib/i18n/format";
import { resolveRequestLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import { requirePortalBackend } from "@/server/web/portal";

export default async function PortalDashboardPage() {
  const locale = await resolveRequestLocale();
  const t = createTranslator(locale.locale, ["portal"]).t;
  const { actor, service } = await requirePortalBackend();
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getPublicLocalizationContext();
  const fallbackLocale = getContentFallbackLocale(locale.locale, localization);
  const projectRows = service.listProjects(actor);
  const projectTranslations = content.listBatch("project", projectRows.map((project) => project.id));
  const projects = projectRows.map((project) => content.resolveEntity("project", project, {
    locale: locale.locale,
    fallbackLocale,
    defaultLocale: locale.defaultLocale,
    translations: projectTranslations.get(project.id) ?? [],
  }));
  const activeProjects = projects.filter((project) => project.status !== "completed" && project.status !== "cancelled");
  const completedProjects = projects.filter((project) => project.status === "completed");
  const avgProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">{t("portal.dashboard.title")}</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("portal.dashboard.activeProjects")} value={String(activeProjects.length)} icon={FolderKanban} tone="blue" />
        <StatCard label={t("portal.dashboard.completed")} value={String(completedProjects.length)} icon={CheckCircle2} tone="green" />
        <StatCard label={t("portal.dashboard.averageProgress")} value={`%${avgProgress}`} icon={BarChart} tone="amber" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("portal.dashboard.allProjects")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 ? (
            <div className="col-span-full py-10 text-center border rounded-lg border-dashed text-muted-foreground">
              {t("portal.projects.empty")}
            </div>
          ) : projects.map((project) => (
            <Link key={project.id} href={`/portal/projects/${project.id}`}>
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 shrink-0 rounded-full ${project.status === "completed" ? "bg-emerald-500" : project.status === "active" ? "bg-blue-500" : "bg-amber-500"}`} />
                        <h3 className="font-semibold text-base line-clamp-2 leading-tight">{project.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={project.status === "completed" ? "secondary" : "default"} className="capitalize text-[10px] px-1.5 py-0">
                        {project.status === "completed" ? t("portal.status.project.completed") : project.status === "active" ? t("portal.status.project.active") : t("portal.status.project.waiting")}
                      </Badge>
                      {project.dueDate && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{t("portal.labels.delivery")}: {formatDate(project.dueDate, locale.locale)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground">{t("portal.labels.progress")}</span>
                      <span>%{project.progress}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
