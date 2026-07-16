import { and, asc, count, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import {
  calendarEvents,
  chatMessages,
  chatSessions,
  clientActivities,
  clients,
  contracts,
  financeTransactions,
  invoices,
  journalEntries,
  projectPlanningSections,
  projectRevisions,
  projects,
  proposals,
  subscriptions,
  tasks,
} from "../db/schema/domain";
import type { ClientScope, OwnerScope } from "../domain/actor";
import type { DomainDatabase } from "../domain/database";

export function createDomainRepositories(db: DomainDatabase) {
  return {
    clients: {
      list: (scope: OwnerScope) =>
        db.select().from(clients).where(eq(clients.ownerUserId, scope.ownerUserId)).orderBy(desc(clients.updatedAt)).all(),
      recent: (scope: OwnerScope, limit: number) =>
        db.select().from(clients).where(eq(clients.ownerUserId, scope.ownerUserId)).orderBy(desc(clients.createdAt)).limit(limit).all(),
      get: (scope: OwnerScope, id: string) =>
        db.select().from(clients).where(and(eq(clients.id, id), eq(clients.ownerUserId, scope.ownerUserId))).get(),
      getByPortalScope: (scope: ClientScope) =>
        db.select().from(clients).where(and(eq(clients.id, scope.clientId), eq(clients.authUserId, scope.authUserId))).get(),
      create: (scope: OwnerScope, value: Omit<typeof clients.$inferInsert, "ownerUserId">) =>
        db.insert(clients).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      update: (scope: OwnerScope, id: string, value: Partial<typeof clients.$inferInsert>) =>
        db.update(clients).set(value).where(and(eq(clients.id, id), eq(clients.ownerUserId, scope.ownerUserId))).returning().get(),
      remove: (scope: OwnerScope, id: string) =>
        db.delete(clients).where(and(eq(clients.id, id), eq(clients.ownerUserId, scope.ownerUserId))).returning().get(),
      listActivities: (scope: OwnerScope, clientId: string) =>
        db.select().from(clientActivities).where(and(eq(clientActivities.ownerUserId, scope.ownerUserId), eq(clientActivities.clientId, clientId))).orderBy(desc(clientActivities.activityDate)).all(),
      listAllActivities: (scope: OwnerScope) =>
        db.select().from(clientActivities).where(eq(clientActivities.ownerUserId, scope.ownerUserId)).orderBy(desc(clientActivities.activityDate)).all(),
      createActivity: (scope: OwnerScope, value: Omit<typeof clientActivities.$inferInsert, "ownerUserId">) =>
        db.insert(clientActivities).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
    },
    projects: {
      list: (scope: OwnerScope) =>
        db.select().from(projects).where(eq(projects.ownerUserId, scope.ownerUserId)).orderBy(desc(projects.updatedAt)).all(),
      recent: (scope: OwnerScope, limit: number) =>
        db.select().from(projects).where(eq(projects.ownerUserId, scope.ownerUserId)).orderBy(desc(projects.createdAt)).limit(limit).all(),
      get: (scope: OwnerScope, id: string) =>
        db.select().from(projects).where(and(eq(projects.id, id), eq(projects.ownerUserId, scope.ownerUserId))).get(),
      getForClient: (scope: ClientScope, id: string) =>
        db.select({ project: projects })
          .from(projects)
          .innerJoin(
            clients,
            and(
              eq(projects.clientId, clients.id),
              eq(clients.id, scope.clientId),
              eq(clients.authUserId, scope.authUserId),
            ),
          )
          .where(eq(projects.id, id))
          .get()?.project,
      listForClient: (scope: ClientScope) =>
        db.select({ project: projects })
          .from(projects)
          .innerJoin(
            clients,
            and(
              eq(projects.clientId, clients.id),
              eq(clients.id, scope.clientId),
              eq(clients.authUserId, scope.authUserId),
            ),
          )
          .orderBy(desc(projects.updatedAt))
          .all()
          .map(({ project }) => project),
      create: (scope: OwnerScope, value: Omit<typeof projects.$inferInsert, "ownerUserId">) =>
        db.insert(projects).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      update: (scope: OwnerScope, id: string, value: Partial<typeof projects.$inferInsert>) =>
        db.update(projects).set(value).where(and(eq(projects.id, id), eq(projects.ownerUserId, scope.ownerUserId))).returning().get(),
      remove: (scope: OwnerScope, id: string) =>
        db.delete(projects).where(and(eq(projects.id, id), eq(projects.ownerUserId, scope.ownerUserId))).returning().get(),
    },
    tasks: {
      list: (scope: OwnerScope) =>
        db.select().from(tasks).where(eq(tasks.ownerUserId, scope.ownerUserId)).orderBy(desc(tasks.updatedAt)).all(),
      get: (scope: OwnerScope, id: string) =>
        db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.ownerUserId, scope.ownerUserId))).get(),
      listPublicForClient: (scope: ClientScope, projectId?: string) =>
        db.select().from(tasks).where(and(eq(tasks.clientId, scope.clientId), eq(tasks.isPublicToClient, true), projectId ? eq(tasks.projectId, projectId) : undefined)).orderBy(asc(tasks.dueAt)).all(),
      create: (scope: OwnerScope, value: Omit<typeof tasks.$inferInsert, "ownerUserId">) =>
        db.insert(tasks).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      update: (scope: OwnerScope, id: string, value: Partial<typeof tasks.$inferInsert>) =>
        db.update(tasks).set(value).where(and(eq(tasks.id, id), eq(tasks.ownerUserId, scope.ownerUserId))).returning().get(),
      remove: (scope: OwnerScope, id: string) =>
        db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.ownerUserId, scope.ownerUserId))).returning().get(),
      progressCounts: (scope: OwnerScope, projectId: string) =>
        db.select({ total: count(), done: sql<number>`sum(case when ${tasks.status} = 'done' then 1 else 0 end)` }).from(tasks).where(and(eq(tasks.ownerUserId, scope.ownerUserId), eq(tasks.projectId, projectId), ne(tasks.status, "cancelled"))).get(),
    },
    planning: {
      list: (scope: OwnerScope, projectId: string) =>
        db.select().from(projectPlanningSections).where(and(eq(projectPlanningSections.ownerUserId, scope.ownerUserId), eq(projectPlanningSections.projectId, projectId))).orderBy(asc(projectPlanningSections.sortOrder)).all(),
      listForClient: (scope: ClientScope, projectId: string) =>
        db.select({ section: projectPlanningSections }).from(projectPlanningSections).innerJoin(projects, eq(projectPlanningSections.projectId, projects.id)).where(and(eq(projectPlanningSections.projectId, projectId), eq(projects.clientId, scope.clientId))).orderBy(asc(projectPlanningSections.sortOrder)).all().map(({ section }) => section),
      create: (scope: OwnerScope, value: Omit<typeof projectPlanningSections.$inferInsert, "ownerUserId">) =>
        db.insert(projectPlanningSections).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      get: (scope: OwnerScope, id: string) => db.select().from(projectPlanningSections).where(and(eq(projectPlanningSections.id, id), eq(projectPlanningSections.ownerUserId, scope.ownerUserId))).get(),
      update: (scope: OwnerScope, id: string, value: Partial<typeof projectPlanningSections.$inferInsert>) => db.update(projectPlanningSections).set(value).where(and(eq(projectPlanningSections.id, id), eq(projectPlanningSections.ownerUserId, scope.ownerUserId))).returning().get(),
      remove: (scope: OwnerScope, id: string) => db.delete(projectPlanningSections).where(and(eq(projectPlanningSections.id, id), eq(projectPlanningSections.ownerUserId, scope.ownerUserId))).returning().get(),
    },
    calendar: {
      list: (scope: OwnerScope) => db.select().from(calendarEvents).where(eq(calendarEvents.ownerUserId, scope.ownerUserId)).orderBy(asc(calendarEvents.startsAt)).all(),
      get: (scope: OwnerScope, id: string) => db.select().from(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.ownerUserId, scope.ownerUserId))).get(),
      create: (scope: OwnerScope, value: Omit<typeof calendarEvents.$inferInsert, "ownerUserId">) => db.insert(calendarEvents).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      update: (scope: OwnerScope, id: string, value: Partial<typeof calendarEvents.$inferInsert>) => db.update(calendarEvents).set(value).where(and(eq(calendarEvents.id, id), eq(calendarEvents.ownerUserId, scope.ownerUserId))).returning().get(),
      remove: (scope: OwnerScope, id: string) => db.delete(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.ownerUserId, scope.ownerUserId))).returning().get(),
    },
    finance: {
      list: (scope: OwnerScope) => db.select().from(financeTransactions).where(eq(financeTransactions.ownerUserId, scope.ownerUserId)).orderBy(desc(financeTransactions.transactionDate)).all(),
      listInRange: (scope: OwnerScope, startDate: string, endDate: string) =>
        db.select().from(financeTransactions).where(and(eq(financeTransactions.ownerUserId, scope.ownerUserId), gte(financeTransactions.transactionDate, startDate), lte(financeTransactions.transactionDate, endDate))).orderBy(asc(financeTransactions.transactionDate)).all(),
      get: (scope: OwnerScope, id: string) => db.select().from(financeTransactions).where(and(eq(financeTransactions.id, id), eq(financeTransactions.ownerUserId, scope.ownerUserId))).get(),
      create: (scope: OwnerScope, value: Omit<typeof financeTransactions.$inferInsert, "ownerUserId">) => db.insert(financeTransactions).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      update: (scope: OwnerScope, id: string, value: Partial<typeof financeTransactions.$inferInsert>) => db.update(financeTransactions).set(value).where(and(eq(financeTransactions.id, id), eq(financeTransactions.ownerUserId, scope.ownerUserId))).returning().get(),
      remove: (scope: OwnerScope, id: string) => db.delete(financeTransactions).where(and(eq(financeTransactions.id, id), eq(financeTransactions.ownerUserId, scope.ownerUserId))).returning().get(),
    },
    journal: {
      list: (scope: OwnerScope) => db.select().from(journalEntries).where(eq(journalEntries.ownerUserId, scope.ownerUserId)).orderBy(desc(journalEntries.entryDate)).all(),
      listInRange: (scope: OwnerScope, startDate: string, endDate: string) =>
        db.select().from(journalEntries).where(and(eq(journalEntries.ownerUserId, scope.ownerUserId), gte(journalEntries.entryDate, startDate), lte(journalEntries.entryDate, endDate))).orderBy(asc(journalEntries.entryDate)).all(),
      getByDate: (scope: OwnerScope, entryDate: string) => db.select().from(journalEntries).where(and(eq(journalEntries.ownerUserId, scope.ownerUserId), eq(journalEntries.entryDate, entryDate))).get(),
      get: (scope: OwnerScope, id: string) => db.select().from(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.ownerUserId, scope.ownerUserId))).get(),
      create: (scope: OwnerScope, value: Omit<typeof journalEntries.$inferInsert, "ownerUserId">) => db.insert(journalEntries).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      updateByDate: (scope: OwnerScope, entryDate: string, value: Partial<typeof journalEntries.$inferInsert>) => db.update(journalEntries).set(value).where(and(eq(journalEntries.ownerUserId, scope.ownerUserId), eq(journalEntries.entryDate, entryDate))).returning().get(),
      update: (scope: OwnerScope, id: string, value: Partial<typeof journalEntries.$inferInsert>) => db.update(journalEntries).set(value).where(and(eq(journalEntries.id, id), eq(journalEntries.ownerUserId, scope.ownerUserId))).returning().get(),
      remove: (scope: OwnerScope, id: string) => db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.ownerUserId, scope.ownerUserId))).returning().get(),
    },
    revisions: {
      list: (scope: OwnerScope, projectId: string) => db.select().from(projectRevisions).where(and(eq(projectRevisions.ownerUserId, scope.ownerUserId), eq(projectRevisions.projectId, projectId))).orderBy(desc(projectRevisions.createdAt)).all(),
      updateStatus: (scope: OwnerScope, id: string, status: typeof projectRevisions.$inferInsert.status) => db.update(projectRevisions).set({ status }).where(and(eq(projectRevisions.id, id), eq(projectRevisions.ownerUserId, scope.ownerUserId))).returning().get(),
      listForClient: (scope: ClientScope, projectId: string) => db.select().from(projectRevisions).where(and(eq(projectRevisions.clientId, scope.clientId), eq(projectRevisions.projectId, projectId))).orderBy(desc(projectRevisions.createdAt)).all(),
      listAllForClient: (scope: ClientScope) => db.select({ revision: projectRevisions })
        .from(projectRevisions)
        .innerJoin(
          projects,
          and(
            eq(projectRevisions.projectId, projects.id),
            eq(projects.clientId, scope.clientId),
          ),
        )
        .innerJoin(
          clients,
          and(
            eq(projects.clientId, clients.id),
            eq(clients.authUserId, scope.authUserId),
          ),
        )
        .where(eq(projectRevisions.clientId, scope.clientId))
        .orderBy(desc(projectRevisions.createdAt))
        .all()
        .map(({ revision }) => revision),
    },
    chat: {
      listSessions: (scope: OwnerScope) => db.select().from(chatSessions).where(eq(chatSessions.ownerUserId, scope.ownerUserId)).orderBy(desc(chatSessions.updatedAt)).all(),
      getSession: (scope: OwnerScope, id: string) => db.select().from(chatSessions).where(and(eq(chatSessions.id, id), eq(chatSessions.ownerUserId, scope.ownerUserId))).get(),
      createSession: (scope: OwnerScope, value: Omit<typeof chatSessions.$inferInsert, "ownerUserId">) => db.insert(chatSessions).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      listMessages: (scope: OwnerScope, sessionId: string) => db.select({ message: chatMessages }).from(chatMessages).innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id)).where(and(eq(chatMessages.sessionId, sessionId), eq(chatSessions.ownerUserId, scope.ownerUserId))).orderBy(asc(chatMessages.createdAt)).all().map(({ message }) => message),
      createMessage: (value: typeof chatMessages.$inferInsert) => db.insert(chatMessages).values(value).returning().get(),
    },
    business: {
      getProposal: (scope: OwnerScope, id: string) => db.select().from(proposals).where(and(eq(proposals.id, id), eq(proposals.ownerUserId, scope.ownerUserId))).get(),
      createProposal: (scope: OwnerScope, value: Omit<typeof proposals.$inferInsert, "ownerUserId">) => db.insert(proposals).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      createContract: (scope: OwnerScope, value: Omit<typeof contracts.$inferInsert, "ownerUserId">) => db.insert(contracts).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      createInvoice: (scope: OwnerScope, value: Omit<typeof invoices.$inferInsert, "ownerUserId">) => db.insert(invoices).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
      createSubscription: (scope: OwnerScope, value: Omit<typeof subscriptions.$inferInsert, "ownerUserId">) => db.insert(subscriptions).values({ ...value, ownerUserId: scope.ownerUserId }).returning().get(),
    },
    analytics: {
      summary: (scope: OwnerScope) => db.select({
        incomeMinor: sql<number>`coalesce(sum(case when ${financeTransactions.type} = 'income' and ${financeTransactions.paymentStatus} = 'paid' then ${financeTransactions.amountMinor} else 0 end), 0)`,
        expenseMinor: sql<number>`coalesce(sum(case when ${financeTransactions.type} = 'expense' and ${financeTransactions.paymentStatus} = 'paid' then ${financeTransactions.amountMinor} else 0 end), 0)`,
        plannedMinor: sql<number>`coalesce(sum(case when ${financeTransactions.paymentStatus} in ('planned', 'pending') then ${financeTransactions.amountMinor} else 0 end), 0)`,
      }).from(financeTransactions).where(eq(financeTransactions.ownerUserId, scope.ownerUserId)).get(),
      projectStatusCounts: (scope: OwnerScope) => db.select({ status: projects.status, value: count() }).from(projects).where(eq(projects.ownerUserId, scope.ownerUserId)).groupBy(projects.status).all(),
      taskStatusCounts: (scope: OwnerScope) => db.select({ status: tasks.status, value: count() }).from(tasks).where(eq(tasks.ownerUserId, scope.ownerUserId)).groupBy(tasks.status).all(),
      taskStatusCountsInRange: (scope: OwnerScope, startDate: Date, endDate: Date) =>
        db.select({ status: tasks.status, value: count() }).from(tasks).where(and(eq(tasks.ownerUserId, scope.ownerUserId), gte(tasks.updatedAt, startDate), lte(tasks.updatedAt, endDate))).groupBy(tasks.status).all(),
      projectIncomeInRange: (scope: OwnerScope, startDate: string, endDate: string) =>
        db.select({
          projectId: projects.id,
          name: projects.name,
          amountMinor: sql<number>`coalesce(sum(${financeTransactions.amountMinor}), 0)`,
        })
          .from(financeTransactions)
          .innerJoin(projects, eq(financeTransactions.projectId, projects.id))
          .where(and(
            eq(financeTransactions.ownerUserId, scope.ownerUserId),
            eq(projects.ownerUserId, scope.ownerUserId),
            eq(financeTransactions.type, "income"),
            eq(financeTransactions.paymentStatus, "paid"),
            gte(financeTransactions.transactionDate, startDate),
            lte(financeTransactions.transactionDate, endDate),
          ))
          .groupBy(projects.id, projects.name)
          .orderBy(desc(sql`sum(${financeTransactions.amountMinor})`))
          .all(),
    },
  };
}

export type DomainRepositories = ReturnType<typeof createDomainRepositories>;
