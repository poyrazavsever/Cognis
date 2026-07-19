import { Card, CardContent, Badge } from "poyraz-ui/atoms";
import { FolderKanban, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/i18n/format";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, getContentFallbackLocale } from "@/server/i18n/content";
import { resolveRequestLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import { requirePortalBackend } from "@/server/web/portal";

export default async function PortalProjectsPage() {
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("portal.projects.title")}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full py-10 text-center border rounded-lg border-dashed text-muted-foreground flex flex-col items-center gap-3">
            <FolderKanban className="w-10 h-10 text-muted-foreground/50" />
            {t("portal.projects.empty")}
          </div>
        ) : projects.map((project) => (
          <Link key={project.id} href={`/portal/projects/${project.id}`}>
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg line-clamp-2">{project.name}</h3>
                    <Badge variant={project.status === "completed" ? "secondary" : "default"} className="capitalize shrink-0">
                      {project.status === "completed" ? t("portal.status.project.completed") : project.status === "active" ? t("portal.status.project.active") : t("portal.status.project.waiting")}
                    </Badge>
                  </div>
                  {project.dueDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{t("portal.labels.deadline")}: {formatDate(project.dueDate, locale.locale)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>{t("portal.labels.progress")}</span>
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
  );
}
