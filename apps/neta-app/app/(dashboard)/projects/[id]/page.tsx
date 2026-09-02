import { notFound } from "next/navigation";
import {
  ProjectDetailClient,
  type ProjectDetail,
  type ProjectDetailTaskItem,
  type ProjectFinanceItem,
  type ProjectPlanningSectionItem,
  type ProjectRevisionItem,
} from "@/app/(dashboard)/projects/[id]/project-detail-client";
import { getSqliteConnection } from "@/server/db/client";
import { DomainError } from "@/server/domain/errors";
import { ContentTranslationService, type ContentTranslationRow } from "@/server/i18n/content";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const payload = getClientI18nPayload(locale.locale, ["projects", "tasks", "common"]);
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getLocalizationContext(actor);

  let data: {
    project: ProjectDetail;
    sections: ProjectPlanningSectionItem[];
    tasks: ProjectDetailTaskItem[];
    financeTransactions: ProjectFinanceItem[];
    revisions: ProjectRevisionItem[];
  };
  try {
    const row = service.getProject(actor, id);
    const projectTranslationRows = content.listEntityTranslations("project", row.id);
    const resolvedProject = content.resolveEntity("project", row, {
      locale: locale.locale,
      defaultLocale: localization.defaultLocale,
      translations: projectTranslationRows,
    });
    const client = row.clientId ? service.getClient(actor, row.clientId) : null;
    const project: ProjectDetail = {
      id: row.id,
      client_id: row.clientId,
      clientName: client?.name ?? null,
      name: resolvedProject.name,
      type: row.type,
      description: resolvedProject.description,
      status: row.status,
      start_date: row.startDate,
      due_date: row.dueDate,
      budget_amount: row.budgetAmountMinor == null ? null : row.budgetAmountMinor / 100,
      currency: row.currency,
      progress: row.progress,
      progress_type: row.progressType,
      revision_quota: row.revisionQuota,
      cover_image_alt: resolvedProject.coverImageAlt,
      coverImageUrl: row.legacyCoverImagePath,
      translations: toLocalizedValues(projectTranslationRows),
    };
    const sectionRows = service.listPlanningSections(actor, id);
    const sectionTranslations = content.listBatch("planning_section", sectionRows.map((section) => section.id));
    const sections: ProjectPlanningSectionItem[] = sectionRows.map((section) => {
      const translationRows = sectionTranslations.get(section.id) ?? [];
      const resolvedSection = content.resolveEntity("planning_section", section, {
        locale: locale.locale,
        defaultLocale: localization.defaultLocale,
        translations: translationRows,
      });
      return {
        id: section.id,
        project_id: section.projectId,
        category: section.category,
        title: resolvedSection.title,
        content: resolvedSection.content,
        sort_order: section.sortOrder,
        translations: toLocalizedValues(translationRows),
      };
    });
    const taskRows = service.listTasks(actor, id).filter((task) => task.status !== "cancelled");
    const taskTranslations = content.listBatch("task", taskRows.map((task) => task.id));
    const tasks: ProjectDetailTaskItem[] = taskRows
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
          status: task.status as ProjectDetailTaskItem["status"],
          priority: task.priority,
          due_at: task.dueAt?.toISOString() ?? null,
          is_public_to_client: task.isPublicToClient,
          translations: toLocalizedValues(translationRows),
        };
      });
    const financeTransactions: ProjectFinanceItem[] = service.listFinanceTransactions(actor)
      .filter((transaction) => transaction.projectId === id)
      .map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amountMinor / 100,
        currency: transaction.currency,
        payment_status: transaction.paymentStatus,
        transaction_date: transaction.transactionDate,
        category: transaction.category,
      }));
    const revisions = service.listRevisions(actor, id).map((revision) => ({
      id: revision.id,
      description: revision.description,
      status: revision.status,
      created_at: revision.createdAt.toISOString(),
      requested_by: revision.requestedByUserId,
    }));

    data = { project, sections, tasks, financeTransactions, revisions };
  } catch (error) {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const i18nPayload = await getClientI18nPayload(locale.locale, ["projects", "tasks", "common"]);

  return (
    <I18nProvider {...i18nPayload}>
      <ProjectDetailClient
        project={data.project}
        sections={data.sections}
        tasks={data.tasks}
        financeTransactions={data.financeTransactions}
        revisions={data.revisions}
        localization={localization}
      />
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
