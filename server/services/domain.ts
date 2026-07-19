import { and, count, eq, inArray, ne } from "drizzle-orm";
import {
  chatSessions,
  journalEntries,
  projectRevisions,
  projects,
} from "../db/schema/domain";
import { requireClientScope, requireOwnerScope, type DomainActor, type OwnerScope } from "../domain/actor";
import type { DomainDatabase } from "../domain/database";
import { conflict, DomainError, notFound } from "../domain/errors";
import { generateId, type IdGenerator } from "../domain/id";
import {
  calendarEventCreateSchema,
  chatMessageCreateSchema,
  chatSessionCreateSchema,
  clientActivityCreateSchema,
  clientCreateSchema,
  clientUpdateSchema,
  contractCreateSchema,
  contractUpdateSchema,
  financeTransactionCreateSchema,
  financeTransactionUpdateSchema,
  invoiceCreateSchema,
  invoiceUpdateSchema,
  journalEntrySchema,
  parseDomainInput,
  planningSectionCreateSchema,
  planningSectionUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  proposalCreateSchema,
  proposalUpdateSchema,
  revisionCreateSchema,
  revisionStatusSchema,
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  calendarEventUpdateSchema,
} from "../domain/validation";
import { createDomainRepositories, type DomainRepositories } from "../repositories/domain";
import { ContentTranslationService, projectBaseFromTranslations } from "../i18n/content";
import type { ContentTranslationInput } from "../../lib/i18n/content";

export class DomainService {
  readonly repositories: DomainRepositories;
  private readonly contentTranslations: ContentTranslationService;

  constructor(
    private readonly db: DomainDatabase,
    private readonly id: IdGenerator = generateId,
  ) {
    this.repositories = createDomainRepositories(db);
    this.contentTranslations = new ContentTranslationService(db);
  }

  listClients(actor: DomainActor) {
    return this.repositories.clients.list(requireOwnerScope(actor));
  }

  getClient(actor: DomainActor, id: string) {
    if (actor.role === "client") {
      const scope = requireClientScope(actor);
      if (scope.clientId !== id) throw notFound("Müşteri");
      return this.repositories.clients.getByPortalScope(scope) ?? this.throwNotFound("Müşteri");
    }
    return this.repositories.clients.get(requireOwnerScope(actor), id) ?? this.throwNotFound("Müşteri");
  }

  createClient(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(clientCreateSchema, input);
    return this.repositories.clients.create(scope, { ...value, id: value.id ?? this.id() });
  }

  updateClient(actor: DomainActor, id: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(clientUpdateSchema, input);
    return this.repositories.clients.update(scope, id, value) ?? this.throwNotFound("Müşteri");
  }

  deleteClient(actor: DomainActor, id: string) {
    return this.repositories.clients.remove(requireOwnerScope(actor), id) ?? this.throwNotFound("Müşteri");
  }

  addClientActivity(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(clientActivityCreateSchema, input);
    this.requireOwnedClient(scope, value.clientId);
    return this.repositories.clients.createActivity(scope, { ...value, id: value.id ?? this.id() });
  }

  listClientActivities(actor: DomainActor, clientId: string) {
    const scope = requireOwnerScope(actor);
    this.requireOwnedClient(scope, clientId);
    return this.repositories.clients.listActivities(scope, clientId);
  }

  listAllClientActivities(actor: DomainActor) {
    return this.repositories.clients.listAllActivities(requireOwnerScope(actor));
  }

  listProjects(actor: DomainActor) {
    if (actor.role === "client") {
      return this.repositories.projects.listForClient(requireClientScope(actor));
    }
    return this.repositories.projects.list(requireOwnerScope(actor));
  }

  getProject(actor: DomainActor, id: string) {
    const project = actor.role === "client"
      ? this.repositories.projects.getForClient(requireClientScope(actor), id)
      : this.repositories.projects.get(requireOwnerScope(actor), id);
    return project ?? this.throwNotFound("Proje");
  }

  createProject(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const translations = this.getContentTranslations(input);
    const defaultLocale = this.contentTranslations.getLocalizationContext(actor).defaultLocale;
    const value = parseDomainInput(
      projectCreateSchema,
      translations ? projectBaseFromTranslations("project", input as Record<string, unknown>, translations, defaultLocale) : input,
    );
    this.assertProjectClient(scope, value.type, value.clientId);
    const id = value.id ?? this.id();
    const created = this.repositories.projects.create(scope, { ...value, id });
    this.contentTranslations.upsertEntityTranslations("project", created.id, translations);
    return created;
  }

  updateProject(actor: DomainActor, projectId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.projects.get(scope, projectId) ?? this.throwNotFound("Proje");
    const translations = this.getContentTranslations(input);
    const defaultLocale = this.contentTranslations.getLocalizationContext(actor).defaultLocale;
    const value = parseDomainInput(
      projectUpdateSchema,
      translations ? projectBaseFromTranslations("project", input as Record<string, unknown>, translations, defaultLocale) : input,
    );
    this.assertProjectClient(scope, value.type ?? current.type, value.clientId === undefined ? current.clientId : value.clientId);
    const updated = this.repositories.projects.update(scope, projectId, value) ?? this.throwNotFound("Proje");
    this.contentTranslations.upsertEntityTranslations("project", updated.id, translations);
    if (
      updated.progressType === "auto"
      && (value.progressType === "auto" || value.progress !== undefined)
    ) {
      this.recalculateProjectProgress(scope, projectId);
      return this.repositories.projects.get(scope, projectId) ?? this.throwNotFound("Proje");
    }
    return updated;
  }

  deleteProject(actor: DomainActor, id: string) {
    const scope = requireOwnerScope(actor);
    const sectionIds = this.repositories.planning.list(scope, id).map((section) => section.id);
    const deleted = this.repositories.projects.remove(scope, id) ?? this.throwNotFound("Proje");
    this.contentTranslations.deleteEntityTranslations("project", id);
    for (const sectionId of sectionIds) {
      this.contentTranslations.deleteEntityTranslations("planning_section", sectionId);
    }
    return deleted;
  }

  listTasks(actor: DomainActor, projectId?: string) {
    if (actor.role === "client") {
      const scope = requireClientScope(actor);
      this.getClient(actor, scope.clientId);
      if (projectId) this.getProject(actor, projectId);
      return this.repositories.tasks.listPublicForClient(scope, projectId);
    }
    const scope = requireOwnerScope(actor);
    const rows = this.repositories.tasks.list(scope);
    return projectId ? rows.filter((task) => task.projectId === projectId) : rows;
  }

  createTask(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const translations = this.getContentTranslations(input);
    const defaultLocale = this.contentTranslations.getLocalizationContext(actor).defaultLocale;
    const value = parseDomainInput(
      taskCreateSchema,
      translations ? projectBaseFromTranslations("task", input as Record<string, unknown>, translations, defaultLocale) : input,
    );
    this.assertTaskRelations(scope, value);
    const task = this.repositories.tasks.create(scope, { ...value, id: value.id ?? this.id() });
    this.contentTranslations.upsertEntityTranslations("task", task.id, translations);
    if (task.projectId) this.recalculateProjectProgress(scope, task.projectId);
    return task;
  }

  updateTask(actor: DomainActor, taskId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.tasks.get(scope, taskId) ?? this.throwNotFound("Görev");
    const translations = this.getContentTranslations(input);
    const defaultLocale = this.contentTranslations.getLocalizationContext(actor).defaultLocale;
    const value = parseDomainInput(
      taskUpdateSchema,
      translations ? projectBaseFromTranslations("task", input as Record<string, unknown>, translations, defaultLocale) : input,
    );
    const merged = { ...current, ...value };
    this.assertTaskRelations(scope, merged);
    const task = this.repositories.tasks.update(scope, taskId, value) ?? this.throwNotFound("Görev");
    this.contentTranslations.upsertEntityTranslations("task", task.id, translations);
    if (current.projectId) this.recalculateProjectProgress(scope, current.projectId);
    if (task.projectId && task.projectId !== current.projectId) this.recalculateProjectProgress(scope, task.projectId);
    return task;
  }

  deleteTask(actor: DomainActor, taskId: string) {
    const scope = requireOwnerScope(actor);
    const task = this.repositories.tasks.remove(scope, taskId) ?? this.throwNotFound("Görev");
    this.contentTranslations.deleteEntityTranslations("task", taskId);
    if (task.projectId) this.recalculateProjectProgress(scope, task.projectId);
    return task;
  }

  createCalendarEvent(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(calendarEventCreateSchema, input);
    this.assertTaskRelations(scope, value);
    return this.repositories.calendar.create(scope, { ...value, id: value.id ?? this.id() });
  }

  listCalendarEvents(actor: DomainActor) {
    return this.repositories.calendar.list(requireOwnerScope(actor));
  }

  updateCalendarEvent(actor: DomainActor, eventId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.calendar.get(scope, eventId) ?? this.throwNotFound("Takvim kaydı");
    const value = parseDomainInput(calendarEventUpdateSchema, input);
    const merged = { ...current, ...value };
    if (merged.endsAt && merged.endsAt < merged.startsAt) {
      throw new DomainError("VALIDATION_ERROR", "Bitiş zamanı başlangıç zamanından önce olamaz.");
    }
    this.assertTaskRelations(scope, merged);
    return this.repositories.calendar.update(scope, eventId, value) ?? this.throwNotFound("Takvim kaydı");
  }

  deleteCalendarEvent(actor: DomainActor, eventId: string) {
    return this.repositories.calendar.remove(requireOwnerScope(actor), eventId) ?? this.throwNotFound("Takvim kaydı");
  }

  createFinanceTransaction(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(financeTransactionCreateSchema, input);
    this.assertTaskRelations(scope, value);
    return this.repositories.finance.create(scope, { ...value, id: value.id ?? this.id() });
  }

  listFinanceTransactions(actor: DomainActor) {
    return this.repositories.finance.list(requireOwnerScope(actor));
  }

  updateFinanceTransaction(actor: DomainActor, transactionId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.finance.get(scope, transactionId) ?? this.throwNotFound("Finans kaydı");
    const value = parseDomainInput(financeTransactionUpdateSchema, input);
    this.assertTaskRelations(scope, { ...current, ...value });
    return this.repositories.finance.update(scope, transactionId, value) ?? this.throwNotFound("Finans kaydı");
  }

  deleteFinanceTransaction(actor: DomainActor, transactionId: string) {
    return this.repositories.finance.remove(requireOwnerScope(actor), transactionId) ?? this.throwNotFound("Finans kaydı");
  }

  saveJournalEntry(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(journalEntrySchema, input);
    const existing = this.repositories.journal.getByDate(scope, value.entryDate);
    if (existing) return this.repositories.journal.updateByDate(scope, value.entryDate, value);
    return this.repositories.journal.create(scope, { ...value, id: value.id ?? this.id() });
  }

  listJournalEntries(actor: DomainActor) {
    return this.repositories.journal.list(requireOwnerScope(actor));
  }

  updateJournalEntry(actor: DomainActor, entryId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(journalEntrySchema.omit({ id: true }), input);
    const conflicting = this.repositories.journal.getByDate(scope, value.entryDate);
    if (conflicting && conflicting.id !== entryId) {
      throw conflict("Bu tarih için zaten bir günlük kaydı var.");
    }
    return this.repositories.journal.update(scope, entryId, value) ?? this.throwNotFound("Günlük kaydı");
  }

  deleteJournalEntry(actor: DomainActor, entryId: string) {
    return this.repositories.journal.remove(requireOwnerScope(actor), entryId) ?? this.throwNotFound("Günlük kaydı");
  }

  addPlanningSection(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const translations = this.getContentTranslations(input);
    const defaultLocale = this.contentTranslations.getLocalizationContext(actor).defaultLocale;
    const value = parseDomainInput(
      planningSectionCreateSchema,
      translations ? projectBaseFromTranslations("planning_section", input as Record<string, unknown>, translations, defaultLocale) : input,
    );
    this.requireOwnedProject(scope, value.projectId);
    const section = this.repositories.planning.create(scope, { ...value, id: value.id ?? this.id() });
    this.contentTranslations.upsertEntityTranslations("planning_section", section.id, translations);
    return section;
  }

  updatePlanningSection(actor: DomainActor, sectionId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    if (!this.repositories.planning.get(scope, sectionId)) throw notFound("Planlama bölümü");
    const translations = this.getContentTranslations(input);
    const defaultLocale = this.contentTranslations.getLocalizationContext(actor).defaultLocale;
    const value = parseDomainInput(
      planningSectionUpdateSchema,
      translations ? projectBaseFromTranslations("planning_section", input as Record<string, unknown>, translations, defaultLocale) : input,
    );
    const section = this.repositories.planning.update(scope, sectionId, value) ?? this.throwNotFound("Planlama bölümü");
    this.contentTranslations.upsertEntityTranslations("planning_section", section.id, translations);
    return section;
  }

  deletePlanningSection(actor: DomainActor, sectionId: string) {
    const section = this.repositories.planning.remove(requireOwnerScope(actor), sectionId) ?? this.throwNotFound("Planlama bölümü");
    this.contentTranslations.deleteEntityTranslations("planning_section", sectionId);
    return section;
  }

  listPlanningSections(actor: DomainActor, projectId: string) {
    if (actor.role === "client") {
      const scope = requireClientScope(actor);
      this.getProject(actor, projectId);
      return this.repositories.planning.listForClient(scope, projectId);
    }
    const scope = requireOwnerScope(actor);
    this.requireOwnedProject(scope, projectId);
    return this.repositories.planning.list(scope, projectId);
  }

  requestRevision(actor: DomainActor, input: unknown) {
    const scope = requireClientScope(actor);
    this.getClient(actor, scope.clientId);
    const value = parseDomainInput(revisionCreateSchema, input);
    const revisionId = value.id ?? this.id();

    return this.db.transaction((tx) => {
      const project = tx.select().from(projects).where(and(eq(projects.id, value.projectId), eq(projects.clientId, scope.clientId))).get();
      if (!project) throw notFound("Proje");
      if (project.status !== "active") {
        throw new DomainError("INVARIANT_VIOLATION", "Yalnızca aktif projeler revizyon kabul eder.");
      }
      const used = tx.select({ value: count() }).from(projectRevisions).where(and(eq(projectRevisions.projectId, project.id), eq(projectRevisions.clientId, scope.clientId), ne(projectRevisions.status, "rejected"))).get()?.value ?? 0;
      if (used >= project.revisionQuota) throw conflict("Projenin revizyon kotası doldu.");
      return tx.insert(projectRevisions).values({
        id: revisionId,
        ownerUserId: project.ownerUserId,
        projectId: project.id,
        clientId: scope.clientId,
        requestedByUserId: scope.authUserId,
        description: value.description,
      }).returning().get();
    }, { behavior: "immediate" });
  }

  updateRevisionStatus(actor: DomainActor, revisionId: string, statusInput: unknown, projectId?: string) {
    const scope = requireOwnerScope(actor);
    if (projectId) {
      this.requireOwnedProject(scope, projectId);
      if (!this.repositories.revisions.list(scope, projectId).some((revision) => revision.id === revisionId)) {
        throw notFound("Revizyon");
      }
    }
    const status = parseDomainInput(revisionStatusSchema, statusInput);
    return this.repositories.revisions.updateStatus(scope, revisionId, status) ?? this.throwNotFound("Revizyon");
  }

  listRevisions(actor: DomainActor, projectId: string) {
    if (actor.role === "client") {
      const scope = requireClientScope(actor);
      this.getProject(actor, projectId);
      return this.repositories.revisions.listForClient(scope, projectId);
    }
    const scope = requireOwnerScope(actor);
    this.requireOwnedProject(scope, projectId);
    return this.repositories.revisions.list(scope, projectId);
  }

  listPortalRevisions(actor: DomainActor) {
    const scope = requireClientScope(actor);
    this.getClient(actor, scope.clientId);
    return this.repositories.revisions.listAllForClient(scope);
  }

  getRevisionAllowance(actor: DomainActor, projectId: string) {
    const scope = requireClientScope(actor);
    const project = this.getProject(actor, projectId);
    const used = this.repositories.revisions
      .listForClient(scope, projectId)
      .filter((revision) => revision.status !== "rejected")
      .length;
    const remaining = Math.max(project.revisionQuota - used, 0);

    return {
      quota: project.revisionQuota,
      used,
      remaining,
      canRequest: project.status === "active" && remaining > 0,
    };
  }

  createChatSession(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(chatSessionCreateSchema, input);
    return this.repositories.chat.createSession(scope, { ...value, id: value.id ?? this.id() });
  }

  listChatSessions(actor: DomainActor) {
    return this.repositories.chat.listSessions(requireOwnerScope(actor));
  }

  getChatSession(actor: DomainActor, sessionId: string) {
    return this.repositories.chat.getSession(requireOwnerScope(actor), sessionId)
      ?? this.throwNotFound("Sohbet");
  }

  listChatMessages(actor: DomainActor, sessionId: string) {
    const scope = requireOwnerScope(actor);
    if (!this.repositories.chat.getSession(scope, sessionId)) throw notFound("Sohbet");
    return this.repositories.chat.listMessages(scope, sessionId);
  }

  deleteChatSession(actor: DomainActor, sessionId: string) {
    return this.repositories.chat.removeSession(requireOwnerScope(actor), sessionId)
      ?? this.throwNotFound("Sohbet");
  }

  addChatMessage(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(chatMessageCreateSchema, input);
    if (!this.repositories.chat.getSession(scope, value.sessionId)) throw notFound("Sohbet");
    if (value.contextJournalEntryIds.length > 0) {
      const accessible = this.db.select({ value: count() }).from(journalEntries).where(and(eq(journalEntries.ownerUserId, scope.ownerUserId), inArray(journalEntries.id, value.contextJournalEntryIds))).get()?.value ?? 0;
      if (accessible !== new Set(value.contextJournalEntryIds).size) throw notFound("Günlük kaydı");
    }
    const message = this.repositories.chat.createMessage({ ...value, id: value.id ?? this.id() });
    this.db.update(chatSessions).set({ updatedAt: new Date() }).where(and(eq(chatSessions.id, value.sessionId), eq(chatSessions.ownerUserId, scope.ownerUserId))).run();
    return message;
  }

  getAnalytics(actor: DomainActor) {
    const scope = requireOwnerScope(actor);
    const finance = this.repositories.analytics.summary(scope) ?? { incomeMinor: 0, expenseMinor: 0, plannedMinor: 0 };
    return {
      finance: { ...finance, netMinor: finance.incomeMinor - finance.expenseMinor },
      projectsByStatus: this.repositories.analytics.projectStatusCounts(scope),
      tasksByStatus: this.repositories.analytics.taskStatusCounts(scope),
    };
  }

  getFreelancerDashboard(
    actor: DomainActor,
    range: { startDate: string; endDate: string; startAt: Date; endAt: Date },
  ) {
    const scope = requireOwnerScope(actor);
    const finance = this.repositories.finance.listInRange(scope, range.startDate, range.endDate);
    const journal = this.repositories.journal.listInRange(scope, range.startDate, range.endDate);
    const projectsByStatus = this.repositories.analytics.projectStatusCounts(scope);
    const tasksByStatus = this.repositories.analytics.taskStatusCountsInRange(
      scope,
      range.startAt,
      range.endAt,
    );

    const financeByDate = new Map<string, { income: number; expense: number }>();
    let incomeMinor = 0;
    let expenseMinor = 0;
    for (const transaction of finance) {
      if (transaction.paymentStatus !== "paid") continue;
      const current = financeByDate.get(transaction.transactionDate) ?? { income: 0, expense: 0 };
      if (transaction.type === "income") {
        current.income += transaction.amountMinor;
        incomeMinor += transaction.amountMinor;
      } else {
        current.expense += transaction.amountMinor;
        expenseMinor += transaction.amountMinor;
      }
      financeByDate.set(transaction.transactionDate, current);
    }

    const moodValues = journal.flatMap((entry) =>
      entry.moodScore == null ? [] : [entry.moodScore],
    );

    return {
      metrics: {
        netProfit: (incomeMinor - expenseMinor) / 100,
        activeProjectsCount:
          projectsByStatus.find((item) => item.status === "active")?.value ?? 0,
        completedTasksCount:
          tasksByStatus.find((item) => item.status === "done")?.value ?? 0,
        avgMood: moodValues.length
          ? (moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length).toFixed(1)
          : "0.0",
        financeTrend: Array.from(financeByDate, ([date, value]) => ({
          date,
          income: value.income / 100,
          expense: value.expense / 100,
        })),
        moodTrend: journal.map((entry) => ({
          date: entry.entryDate,
          mood: entry.moodScore ?? 0,
          energy: entry.energyScore ?? 0,
        })),
      },
      projects: this.repositories.projects.recent(scope, 5),
      clients: this.repositories.clients.recent(scope, 5),
    };
  }

  getFreelancerAnalytics(
    actor: DomainActor,
    range: { startDate: string; endDate: string; startAt: Date; endAt: Date },
  ) {
    const scope = requireOwnerScope(actor);
    const tasksByStatus = this.repositories.analytics.taskStatusCountsInRange(
      scope,
      range.startAt,
      range.endAt,
    );
    const taskCount = (status: string) =>
      tasksByStatus.find((item) => item.status === status)?.value ?? 0;

    return {
      projectIncomeData: this.repositories.analytics
        .projectIncomeInRange(scope, range.startDate, range.endDate)
        .map((item) => ({ name: item.name, value: Number(item.amountMinor) / 100 })),
      completedTasks: taskCount("done"),
      activeTasks: taskCount("todo") + taskCount("in_progress"),
    };
  }

  createProposal(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(proposalCreateSchema, input);
    this.assertTaskRelations(scope, value);
    return this.repositories.business.createProposal(scope, { ...value, id: value.id ?? this.id() });
  }

  listProposals(actor: DomainActor) {
    return this.repositories.business.listProposals(requireOwnerScope(actor));
  }

  getProposal(actor: DomainActor, proposalId: string) {
    return this.repositories.business.getProposal(requireOwnerScope(actor), proposalId)
      ?? this.throwNotFound("Teklif");
  }

  updateProposal(actor: DomainActor, proposalId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.business.getProposal(scope, proposalId)
      ?? this.throwNotFound("Teklif");
    const value = parseDomainInput(proposalUpdateSchema, input);
    this.assertTaskRelations(scope, { ...current, ...value });
    return this.repositories.business.updateProposal(scope, proposalId, value)
      ?? this.throwNotFound("Teklif");
  }

  deleteProposal(actor: DomainActor, proposalId: string) {
    return this.repositories.business.removeProposal(requireOwnerScope(actor), proposalId)
      ?? this.throwNotFound("Teklif");
  }

  createContract(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(contractCreateSchema, input);
    this.assertContractRelations(scope, value);
    return this.repositories.business.createContract(scope, { ...value, id: value.id ?? this.id() });
  }

  listContracts(actor: DomainActor) {
    return this.repositories.business.listContracts(requireOwnerScope(actor));
  }

  getContract(actor: DomainActor, contractId: string) {
    return this.repositories.business.getContract(requireOwnerScope(actor), contractId)
      ?? this.throwNotFound("Sözleşme");
  }

  updateContract(actor: DomainActor, contractId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.business.getContract(scope, contractId)
      ?? this.throwNotFound("Sözleşme");
    const value = parseDomainInput(contractUpdateSchema, input);
    this.assertContractRelations(scope, { ...current, ...value });
    return this.repositories.business.updateContract(scope, contractId, value)
      ?? this.throwNotFound("Sözleşme");
  }

  deleteContract(actor: DomainActor, contractId: string) {
    return this.repositories.business.removeContract(requireOwnerScope(actor), contractId)
      ?? this.throwNotFound("Sözleşme");
  }

  createInvoice(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(invoiceCreateSchema, input);
    this.assertTaskRelations(scope, value);
    return this.repositories.business.createInvoice(scope, { ...value, id: value.id ?? this.id() });
  }

  listInvoices(actor: DomainActor) {
    return this.repositories.business.listInvoices(requireOwnerScope(actor));
  }

  getInvoice(actor: DomainActor, invoiceId: string) {
    return this.repositories.business.getInvoice(requireOwnerScope(actor), invoiceId)
      ?? this.throwNotFound("Fatura");
  }

  updateInvoice(actor: DomainActor, invoiceId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.business.getInvoice(scope, invoiceId)
      ?? this.throwNotFound("Fatura");
    const value = parseDomainInput(invoiceUpdateSchema, input);
    this.assertTaskRelations(scope, { ...current, ...value });
    return this.repositories.business.updateInvoice(scope, invoiceId, value)
      ?? this.throwNotFound("Fatura");
  }

  deleteInvoice(actor: DomainActor, invoiceId: string) {
    return this.repositories.business.removeInvoice(requireOwnerScope(actor), invoiceId)
      ?? this.throwNotFound("Fatura");
  }

  createSubscription(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(subscriptionCreateSchema, input);
    return this.repositories.business.createSubscription(scope, { ...value, id: value.id ?? this.id() });
  }

  listSubscriptions(actor: DomainActor) {
    return this.repositories.business.listSubscriptions(requireOwnerScope(actor));
  }

  getSubscription(actor: DomainActor, subscriptionId: string) {
    return this.repositories.business.getSubscription(requireOwnerScope(actor), subscriptionId)
      ?? this.throwNotFound("Abonelik");
  }

  updateSubscription(actor: DomainActor, subscriptionId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(subscriptionUpdateSchema, input);
    if (!this.repositories.business.getSubscription(scope, subscriptionId)) {
      throw notFound("Abonelik");
    }
    return this.repositories.business.updateSubscription(scope, subscriptionId, value)
      ?? this.throwNotFound("Abonelik");
  }

  deleteSubscription(actor: DomainActor, subscriptionId: string) {
    return this.repositories.business.removeSubscription(requireOwnerScope(actor), subscriptionId)
      ?? this.throwNotFound("Abonelik");
  }

  private requireOwnedClient(scope: OwnerScope, clientId: string) {
    return this.repositories.clients.get(scope, clientId) ?? this.throwNotFound("Müşteri");
  }

  private requireOwnedProject(scope: OwnerScope, projectId: string) {
    return this.repositories.projects.get(scope, projectId) ?? this.throwNotFound("Proje");
  }

  private assertProjectClient(scope: OwnerScope, type: string, clientId: string | null | undefined) {
    if (type === "side_project" && clientId) {
      throw new DomainError("INVARIANT_VIOLATION", "Yan projeler bir müşteriye bağlanamaz.");
    }
    if (clientId) this.requireOwnedClient(scope, clientId);
  }

  private assertTaskRelations(scope: OwnerScope, value: {
    clientId?: string | null;
    projectId?: string | null;
    taskId?: string | null;
    sourceJournalEntryId?: string | null;
  }) {
    const client = value.clientId ? this.requireOwnedClient(scope, value.clientId) : null;
    const project = value.projectId ? this.requireOwnedProject(scope, value.projectId) : null;
    if (project?.clientId && client?.id && project.clientId !== client.id) {
      throw new DomainError("INVARIANT_VIOLATION", "Proje ve müşteri ilişkisi uyuşmuyor.");
    }
    if (project?.clientId && !client) {
      throw new DomainError("INVARIANT_VIOLATION", "Müşteri projesine bağlı kayıt müşteri kimliğini içermelidir.");
    }
    if (value.taskId) {
      const task = this.repositories.tasks.get(scope, value.taskId) ?? this.throwNotFound("Görev");
      if (value.projectId && task.projectId && value.projectId !== task.projectId) {
        throw new DomainError("INVARIANT_VIOLATION", "Etkinlik ve görev proje ilişkisi uyuşmuyor.");
      }
      if (value.clientId && task.clientId && value.clientId !== task.clientId) {
        throw new DomainError("INVARIANT_VIOLATION", "Etkinlik ve görev müşteri ilişkisi uyuşmuyor.");
      }
    }
    if (value.sourceJournalEntryId && !this.repositories.journal.get(scope, value.sourceJournalEntryId)) {
      throw notFound("Günlük kaydı");
    }
  }

  private assertContractRelations(scope: OwnerScope, value: {
    clientId?: string | null;
    proposalId?: string | null;
  }) {
    const client = value.clientId ? this.requireOwnedClient(scope, value.clientId) : null;
    const proposal = value.proposalId
      ? this.repositories.business.getProposal(scope, value.proposalId) ?? this.throwNotFound("Teklif")
      : null;
    if (proposal?.clientId && client?.id && proposal.clientId !== client.id) {
      throw new DomainError("INVARIANT_VIOLATION", "Teklif ve sözleşme müşterisi uyuşmuyor.");
    }
    if (proposal?.clientId && !client) {
      throw new DomainError(
        "INVARIANT_VIOLATION",
        "Müşterili tekliften üretilen sözleşme müşteri kimliğini içermelidir.",
      );
    }
  }

  private recalculateProjectProgress(scope: OwnerScope, projectId: string) {
    const project = this.repositories.projects.get(scope, projectId);
    if (!project || project.progressType !== "auto") return;
    const counts = this.repositories.tasks.progressCounts(scope, projectId);
    const progress = counts?.total ? Math.round((Number(counts.done) / counts.total) * 100) : 0;
    this.repositories.projects.update(scope, projectId, { progress });
  }

  private throwNotFound(resource: string): never {
    throw notFound(resource);
  }

  private getContentTranslations(input: unknown): ContentTranslationInput | undefined {
    if (!input || typeof input !== "object") return undefined;
    const translations = (input as { translations?: unknown }).translations;
    if (!translations || typeof translations !== "object") return undefined;
    return translations as ContentTranslationInput;
  }
}
