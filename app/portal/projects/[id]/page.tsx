import { notFound } from "next/navigation";
import { getSqliteConnection } from "@/server/db/client";
import { DomainError } from "@/server/domain/errors";
import { ContentTranslationService, getContentFallbackLocale } from "@/server/i18n/content";
import { resolvePortalLocale } from "@/server/i18n/resolver";
import { requirePortalBackend } from "@/server/web/portal";
import {
  PortalProjectClient,
  type PortalPlanningSection,
  type PortalProjectDetail,
  type PortalRevision,
  type PortalTask,
} from "./portal-project-client";

export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await resolvePortalLocale();
  const { actor, service } = await requirePortalBackend();
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getPublicLocalizationContext();
  const fallbackLocale = getContentFallbackLocale(locale.locale, localization);
  let data: {
    project: PortalProjectDetail;
    sections: PortalPlanningSection[];
    tasks: PortalTask[];
    revisions: PortalRevision[];
  };

  try {
    const row = service.getProject(actor, id);
    const projectTranslations = content.listEntityTranslations("project", row.id);
    const projectRow = content.resolveEntity("project", row, {
      locale: locale.locale,
      fallbackLocale,
      defaultLocale: locale.defaultLocale,
      translations: projectTranslations,
    });
    const allowance = service.getRevisionAllowance(actor, id);
    const sectionRows = service.listPlanningSections(actor, id);
    const sectionTranslations = content.listBatch("planning_section", sectionRows.map((section) => section.id));
    const taskRows = service.listTasks(actor, id).filter((task) => task.status !== "cancelled");
    const taskTranslations = content.listBatch("task", taskRows.map((task) => task.id));
    data = {
      project: {
        id: projectRow.id,
        name: projectRow.name,
        description: projectRow.description,
        status: projectRow.status,
        progress: projectRow.progress,
        due_date: projectRow.dueDate,
        revision_quota: allowance.remaining,
        can_request_revision: allowance.canRequest,
      },
      sections: sectionRows.map((section) => {
        const sectionRow = content.resolveEntity("planning_section", section, {
          locale: locale.locale,
          fallbackLocale,
          defaultLocale: locale.defaultLocale,
          translations: sectionTranslations.get(section.id) ?? [],
        });
        return {
          id: sectionRow.id,
          title: sectionRow.title,
          content: sectionRow.content,
          type: sectionRow.category,
        };
      }),
      tasks: taskRows.map((task) => {
        const taskRow = content.resolveEntity("task", task, {
          locale: locale.locale,
          fallbackLocale,
          defaultLocale: locale.defaultLocale,
          translations: taskTranslations.get(task.id) ?? [],
        });
        return {
          id: task.id,
          title: taskRow.title,
          status: task.status as PortalTask["status"],
          date: task.dueAt?.toISOString() ?? task.scheduledDate,
        };
      }),
      revisions: service.listRevisions(actor, id).map((revision) => ({
        id: revision.id,
        description: revision.description,
        status: revision.status,
        source_locale: revision.sourceLocale,
        created_at: revision.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <PortalProjectClient
      project={data.project}
      sections={data.sections}
      tasks={data.tasks}
      revisions={data.revisions}
      locale={locale.locale}
    />
  );
}
