import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  type CalendarEventType,
  type ChatMessageRole,
  type ClientActivityType,
  type ClientPipelineStage,
  type ClientStatus,
  type ContractStatus,
  type FinanceTransactionType,
  type InvoiceStatus,
  type PaymentStatus,
  type PlanningSectionCategory,
  type ProjectProgressType,
  type ProjectStatus,
  type ProjectType,
  type ProposalStatus,
  type RevisionStatus,
  type SubscriptionBillingCycle,
  type SubscriptionStatus,
  type TaskPriority,
  type TaskStatus,
} from "../../domain/types";
import { user } from "./auth";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    authUserId: text("auth_user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    companyName: text("company_name"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    portalLocale: text("portal_locale"),
    status: text("status").$type<ClientStatus>().default("active").notNull(),
    pipelineStage: text("pipeline_stage").$type<ClientPipelineStage>().default("lead").notNull(),
    nextFollowUpDate: text("next_follow_up_date"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("clients_auth_user_id_unique").on(table.authUserId),
    index("clients_owner_user_id_idx").on(table.ownerUserId),
    index("clients_owner_status_idx").on(table.ownerUserId, table.status),
    index("clients_owner_pipeline_idx").on(table.ownerUserId, table.pipelineStage),
    index("clients_portal_locale_idx").on(table.portalLocale),
    index("clients_next_follow_up_date_idx").on(table.nextFollowUpDate),
    check("clients_status_check", sql`${table.status} in ('active', 'paused', 'archived')`),
    check(
      "clients_pipeline_stage_check",
      sql`${table.pipelineStage} in ('lead', 'contacted', 'proposal_sent', 'won', 'lost')`,
    ),
  ],
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    type: text("type").$type<ProjectType>().default("client_project").notNull(),
    description: text("description"),
    status: text("status").$type<ProjectStatus>().default("planning").notNull(),
    startDate: text("start_date"),
    dueDate: text("due_date"),
    budgetAmountMinor: integer("budget_amount_minor"),
    currency: text("currency").default("USD").notNull(),
    progress: integer("progress").default(0).notNull(),
    progressType: text("progress_type").$type<ProjectProgressType>().default("manual").notNull(),
    revisionQuota: integer("revision_quota").default(0).notNull(),
    legacyCoverImagePath: text("legacy_cover_image_path"),
    coverImageAlt: text("cover_image_alt"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("projects_owner_user_id_idx").on(table.ownerUserId),
    index("projects_owner_status_idx").on(table.ownerUserId, table.status),
    index("projects_client_id_idx").on(table.clientId),
    index("projects_due_date_idx").on(table.dueDate),
    check("projects_type_check", sql`${table.type} in ('client_project', 'side_project')`),
    check(
      "projects_status_check",
      sql`${table.status} in ('planning', 'active', 'paused', 'completed', 'cancelled')`,
    ),
    check("projects_progress_check", sql`${table.progress} between 0 and 100`),
    check("projects_revision_quota_check", sql`${table.revisionQuota} >= 0`),
    check("projects_budget_check", sql`${table.budgetAmountMinor} is null or ${table.budgetAmountMinor} >= 0`),
    check("projects_currency_check", sql`length(${table.currency}) = 3`),
  ],
);

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entryDate: text("entry_date").notNull(),
    moodScore: integer("mood_score"),
    energyScore: integer("energy_score"),
    workSatisfactionScore: integer("work_satisfaction_score"),
    moodLabel: text("mood_label"),
    note: text("note"),
    legacyAiMetadata: text("legacy_ai_metadata", { mode: "json" }).$type<Record<string, unknown> | null>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("journal_entries_owner_date_unique").on(table.ownerUserId, table.entryDate),
    index("journal_entries_owner_date_idx").on(table.ownerUserId, table.entryDate),
    check("journal_entries_mood_score_check", sql`${table.moodScore} is null or ${table.moodScore} between 1 and 5`),
    check("journal_entries_energy_score_check", sql`${table.energyScore} is null or ${table.energyScore} between 1 and 5`),
    check(
      "journal_entries_work_score_check",
      sql`${table.workSatisfactionScore} is null or ${table.workSatisfactionScore} between 1 and 5`,
    ),
  ],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    sourceJournalEntryId: text("source_journal_entry_id").references(() => journalEntries.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").$type<TaskStatus>().default("todo").notNull(),
    priority: text("priority").$type<TaskPriority>().default("medium").notNull(),
    scheduledDate: text("scheduled_date"),
    dueAt: integer("due_at", { mode: "timestamp_ms" }),
    estimatedMinutes: integer("estimated_minutes"),
    actualMinutes: integer("actual_minutes"),
    aiGenerated: integer("ai_generated", { mode: "boolean" }).default(false).notNull(),
    isPublicToClient: integer("is_public_to_client", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tasks_owner_user_id_idx").on(table.ownerUserId),
    index("tasks_owner_status_idx").on(table.ownerUserId, table.status),
    index("tasks_project_id_idx").on(table.projectId),
    index("tasks_client_id_idx").on(table.clientId),
    index("tasks_due_at_idx").on(table.dueAt),
    check("tasks_status_check", sql`${table.status} in ('todo', 'in_progress', 'done', 'cancelled')`),
    check("tasks_priority_check", sql`${table.priority} in ('low', 'medium', 'high', 'urgent')`),
    check("tasks_estimated_minutes_check", sql`${table.estimatedMinutes} is null or ${table.estimatedMinutes} >= 0`),
    check("tasks_actual_minutes_check", sql`${table.actualMinutes} is null or ${table.actualMinutes} >= 0`),
  ],
);

export const calendarEvents = sqliteTable(
  "calendar_events",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").$type<CalendarEventType>().default("focus").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("calendar_events_owner_range_idx").on(table.ownerUserId, table.startsAt),
    index("calendar_events_project_id_idx").on(table.projectId),
    index("calendar_events_task_id_idx").on(table.taskId),
    check("calendar_events_type_check", sql`${table.type} in ('meeting', 'focus', 'deadline', 'personal', 'finance')`),
    check("calendar_events_time_check", sql`${table.endsAt} is null or ${table.endsAt} >= ${table.startsAt}`),
  ],
);

export const financeTransactions = sqliteTable(
  "finance_transactions",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    type: text("type").$type<FinanceTransactionType>().notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").default("USD").notNull(),
    transactionDate: text("transaction_date").notNull(),
    category: text("category"),
    paymentStatus: text("payment_status").$type<PaymentStatus>().default("planned").notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("finance_transactions_owner_date_idx").on(table.ownerUserId, table.transactionDate),
    index("finance_transactions_owner_type_idx").on(table.ownerUserId, table.type),
    index("finance_transactions_client_id_idx").on(table.clientId),
    index("finance_transactions_project_id_idx").on(table.projectId),
    check("finance_transactions_type_check", sql`${table.type} in ('income', 'expense')`),
    check("finance_transactions_amount_check", sql`${table.amountMinor} >= 0`),
    check(
      "finance_transactions_payment_status_check",
      sql`${table.paymentStatus} in ('planned', 'pending', 'paid', 'cancelled')`,
    ),
    check("finance_transactions_currency_check", sql`length(${table.currency}) = 3`),
  ],
);

export const clientActivities = sqliteTable(
  "client_activities",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    type: text("type").$type<ClientActivityType>().notNull(),
    title: text("title").notNull(),
    content: text("content"),
    activityDate: integer("activity_date", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    index("client_activities_owner_client_idx").on(table.ownerUserId, table.clientId),
    index("client_activities_client_date_idx").on(table.clientId, table.activityDate),
    check("client_activities_type_check", sql`${table.type} in ('note', 'call', 'meeting', 'email')`),
  ],
);

export const projectPlanningSections = sqliteTable(
  "project_planning_sections",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    category: text("category").$type<PlanningSectionCategory>().notNull(),
    title: text("title").notNull(),
    content: text("content"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("project_planning_sections_owner_idx").on(table.ownerUserId),
    index("project_planning_sections_project_order_idx").on(table.projectId, table.sortOrder),
    check(
      "project_planning_sections_category_check",
      sql`${table.category} in ('overview', 'problem', 'goal', 'audience', 'scope', 'design_system', 'color_palette', 'typography', 'assets', 'notes')`,
    ),
  ],
);

export const projectRevisions = sqliteTable(
  "project_revisions",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    requestedByUserId: text("requested_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    status: text("status").$type<RevisionStatus>().default("pending").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("project_revisions_owner_project_idx").on(table.ownerUserId, table.projectId),
    index("project_revisions_client_project_idx").on(table.clientId, table.projectId),
    check(
      "project_revisions_status_check",
      sql`${table.status} in ('pending', 'in_progress', 'completed', 'rejected')`,
    ),
  ],
);

export const chatSessions = sqliteTable(
  "chat_sessions",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("chat_sessions_owner_updated_idx").on(table.ownerUserId, table.updatedAt)],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").$type<ChatMessageRole>().notNull(),
    content: text("content").notNull(),
    contextJournalEntryIds: text("context_journal_entry_ids", { mode: "json" })
      .$type<string[]>()
      .default([])
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    index("chat_messages_session_created_idx").on(table.sessionId, table.createdAt),
    check("chat_messages_role_check", sql`${table.role} in ('system', 'user', 'assistant', 'tool')`),
  ],
);

export const proposals = sqliteTable(
  "proposals",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    amountMinor: integer("amount_minor").default(0).notNull(),
    currency: text("currency").default("TRY").notNull(),
    status: text("status").$type<ProposalStatus>().default("draft").notNull(),
    validUntil: integer("valid_until", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    index("proposals_owner_status_idx").on(table.ownerUserId, table.status),
    check("proposals_status_check", sql`${table.status} in ('draft', 'sent', 'accepted', 'rejected')`),
    check("proposals_amount_check", sql`${table.amountMinor} >= 0`),
  ],
);

export const contracts = sqliteTable(
  "contracts",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    content: text("content"),
    status: text("status").$type<ContractStatus>().default("draft").notNull(),
    signedAt: integer("signed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    index("contracts_owner_status_idx").on(table.ownerUserId, table.status),
    check("contracts_status_check", sql`${table.status} in ('draft', 'active', 'completed', 'cancelled')`),
  ],
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    invoiceNumber: text("invoice_number").notNull(),
    amountMinor: integer("amount_minor").default(0).notNull(),
    taxBasisPoints: integer("tax_basis_points").default(0).notNull(),
    currency: text("currency").default("TRY").notNull(),
    status: text("status").$type<InvoiceStatus>().default("draft").notNull(),
    issueDate: text("issue_date").notNull(),
    dueDate: text("due_date"),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    uniqueIndex("invoices_owner_number_unique").on(table.ownerUserId, table.invoiceNumber),
    index("invoices_owner_status_idx").on(table.ownerUserId, table.status),
    check("invoices_status_check", sql`${table.status} in ('draft', 'sent', 'paid', 'overdue', 'cancelled')`),
    check("invoices_amount_check", sql`${table.amountMinor} >= 0`),
    check("invoices_tax_check", sql`${table.taxBasisPoints} between 0 and 10000`),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amountMinor: integer("amount_minor").default(0).notNull(),
    currency: text("currency").default("TRY").notNull(),
    billingCycle: text("billing_cycle").$type<SubscriptionBillingCycle>().default("monthly").notNull(),
    nextBillingDate: text("next_billing_date"),
    status: text("status").$type<SubscriptionStatus>().default("active").notNull(),
    category: text("category"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    index("subscriptions_owner_status_idx").on(table.ownerUserId, table.status),
    index("subscriptions_next_billing_date_idx").on(table.nextBillingDate),
    check("subscriptions_cycle_check", sql`${table.billingCycle} in ('weekly', 'monthly', 'yearly')`),
    check("subscriptions_status_check", sql`${table.status} in ('active', 'cancelled')`),
    check("subscriptions_amount_check", sql`${table.amountMinor} >= 0`),
  ],
);
