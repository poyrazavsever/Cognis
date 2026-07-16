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
  financeTransactionCreateSchema,
  financeTransactionUpdateSchema,
  invoiceCreateSchema,
  journalEntrySchema,
  parseDomainInput,
  planningSectionCreateSchema,
  planningSectionUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  proposalCreateSchema,
  revisionCreateSchema,
  revisionStatusSchema,
  subscriptionCreateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  calendarEventUpdateSchema,
} from "../domain/validation";
import { createDomainRepositories, type DomainRepositories } from "../repositories/domain";

export class DomainService {
  readonly repositories: DomainRepositories;

  constructor(
    private readonly db: DomainDatabase,
    private readonly id: IdGenerator = generateId,
  ) {
    this.repositories = createDomainRepositories(db);
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
    const value = parseDomainInput(projectCreateSchema, input);
    this.assertProjectClient(scope, value.type, value.clientId);
    return this.repositories.projects.create(scope, { ...value, id: value.id ?? this.id() });
  }

  updateProject(actor: DomainActor, projectId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.projects.get(scope, projectId) ?? this.throwNotFound("Proje");
    const value = parseDomainInput(projectUpdateSchema, input);
    this.assertProjectClient(scope, value.type ?? current.type, value.clientId === undefined ? current.clientId : value.clientId);
    return this.repositories.projects.update(scope, projectId, value) ?? this.throwNotFound("Proje");
  }

  deleteProject(actor: DomainActor, id: string) {
    return this.repositories.projects.remove(requireOwnerScope(actor), id) ?? this.throwNotFound("Proje");
  }

  listTasks(actor: DomainActor, projectId?: string) {
    if (actor.role === "client") {
      const scope = requireClientScope(actor);
      if (projectId) this.getProject(actor, projectId);
      return this.repositories.tasks.listPublicForClient(scope, projectId);
    }
    const scope = requireOwnerScope(actor);
    const rows = this.repositories.tasks.list(scope);
    return projectId ? rows.filter((task) => task.projectId === projectId) : rows;
  }

  createTask(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(taskCreateSchema, input);
    this.assertTaskRelations(scope, value);
    const task = this.repositories.tasks.create(scope, { ...value, id: value.id ?? this.id() });
    if (task.projectId) this.recalculateProjectProgress(scope, task.projectId);
    return task;
  }

  updateTask(actor: DomainActor, taskId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    const current = this.repositories.tasks.get(scope, taskId) ?? this.throwNotFound("Görev");
    const value = parseDomainInput(taskUpdateSchema, input);
    const merged = { ...current, ...value };
    this.assertTaskRelations(scope, merged);
    const task = this.repositories.tasks.update(scope, taskId, value) ?? this.throwNotFound("Görev");
    if (current.projectId) this.recalculateProjectProgress(scope, current.projectId);
    if (task.projectId && task.projectId !== current.projectId) this.recalculateProjectProgress(scope, task.projectId);
    return task;
  }

  deleteTask(actor: DomainActor, taskId: string) {
    const scope = requireOwnerScope(actor);
    const task = this.repositories.tasks.remove(scope, taskId) ?? this.throwNotFound("Görev");
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

  deleteJournalEntry(actor: DomainActor, entryId: string) {
    return this.repositories.journal.remove(requireOwnerScope(actor), entryId) ?? this.throwNotFound("Günlük kaydı");
  }

  addPlanningSection(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(planningSectionCreateSchema, input);
    this.requireOwnedProject(scope, value.projectId);
    return this.repositories.planning.create(scope, { ...value, id: value.id ?? this.id() });
  }

  updatePlanningSection(actor: DomainActor, sectionId: string, input: unknown) {
    const scope = requireOwnerScope(actor);
    if (!this.repositories.planning.get(scope, sectionId)) throw notFound("Planlama bölümü");
    const value = parseDomainInput(planningSectionUpdateSchema, input);
    return this.repositories.planning.update(scope, sectionId, value) ?? this.throwNotFound("Planlama bölümü");
  }

  deletePlanningSection(actor: DomainActor, sectionId: string) {
    return this.repositories.planning.remove(requireOwnerScope(actor), sectionId) ?? this.throwNotFound("Planlama bölümü");
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

  updateRevisionStatus(actor: DomainActor, revisionId: string, statusInput: unknown) {
    const status = parseDomainInput(revisionStatusSchema, statusInput);
    return this.repositories.revisions.updateStatus(requireOwnerScope(actor), revisionId, status) ?? this.throwNotFound("Revizyon");
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

  createChatSession(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(chatSessionCreateSchema, input);
    return this.repositories.chat.createSession(scope, { ...value, id: value.id ?? this.id() });
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

  createProposal(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(proposalCreateSchema, input);
    this.assertTaskRelations(scope, value);
    return this.repositories.business.createProposal(scope, { ...value, id: value.id ?? this.id() });
  }

  createContract(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(contractCreateSchema, input);
    if (value.clientId) this.requireOwnedClient(scope, value.clientId);
    if (value.proposalId && !this.repositories.business.getProposal(scope, value.proposalId)) {
      throw notFound("Teklif");
    }
    return this.repositories.business.createContract(scope, { ...value, id: value.id ?? this.id() });
  }

  createInvoice(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(invoiceCreateSchema, input);
    this.assertTaskRelations(scope, value);
    return this.repositories.business.createInvoice(scope, { ...value, id: value.id ?? this.id() });
  }

  createSubscription(actor: DomainActor, input: unknown) {
    const scope = requireOwnerScope(actor);
    const value = parseDomainInput(subscriptionCreateSchema, input);
    return this.repositories.business.createSubscription(scope, { ...value, id: value.id ?? this.id() });
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
}
