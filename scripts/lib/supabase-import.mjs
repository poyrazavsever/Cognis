import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const IMPORT_FORMAT = "neta-supabase-export";
export const IMPORT_VERSION = 1;

const tableNames = [
  "profiles",
  "clients",
  "client_activities",
  "projects",
  "project_planning_sections",
  "project_revisions",
  "tasks",
  "calendar_events",
  "finance_transactions",
  "daily_logs",
  "journals",
  "chat_sessions",
  "chat_messages",
  "proposals",
  "contracts",
  "invoices",
  "subscriptions",
  "app_settings",
  "document_embeddings",
];

const enumValues = {
  clientStatus: ["active", "paused", "archived"],
  pipelineStage: ["lead", "contacted", "proposal_sent", "won", "lost"],
  projectType: ["client_project", "side_project"],
  projectStatus: ["planning", "active", "paused", "completed", "cancelled"],
  progressType: ["manual", "auto"],
  taskStatus: ["todo", "in_progress", "done", "cancelled"],
  priority: ["low", "medium", "high", "urgent"],
  eventType: ["meeting", "focus", "deadline", "personal", "finance"],
  financeType: ["income", "expense"],
  paymentStatus: ["planned", "pending", "paid", "cancelled"],
  activityType: ["note", "call", "meeting", "email"],
  planningCategory: [
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
  ],
  revisionStatus: ["pending", "in_progress", "completed", "rejected"],
  chatRole: ["system", "user", "assistant", "tool"],
  proposalStatus: ["draft", "sent", "accepted", "rejected"],
  contractStatus: ["draft", "active", "completed", "cancelled"],
  invoiceStatus: ["draft", "sent", "paid", "overdue", "cancelled"],
  billingCycle: ["weekly", "monthly", "yearly"],
  subscriptionStatus: ["active", "cancelled"],
  aiProvider: ["gemini", "openai", "groq", "ollama"],
};

export function loadImportBundle(inputPath) {
  const absoluteInput = path.resolve(inputPath);
  const bundlePath = fs.statSync(absoluteInput).isDirectory()
    ? path.join(absoluteInput, "export.json")
    : absoluteInput;
  const bundleDir = path.dirname(bundlePath);
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));

  if (bundle?.format !== IMPORT_FORMAT || bundle?.version !== IMPORT_VERSION) {
    throw new Error(`Unsupported export format. Expected ${IMPORT_FORMAT} version ${IMPORT_VERSION}.`);
  }
  if (!bundle.source || typeof bundle.source.owner_user_id !== "string") {
    throw new Error("Export source.owner_user_id is required.");
  }
  if (!bundle.tables || typeof bundle.tables !== "object" || Array.isArray(bundle.tables)) {
    throw new Error("Export tables object is required.");
  }

  for (const table of tableNames) {
    const rows = bundle.tables[table] ?? [];
    if (!Array.isArray(rows)) throw new Error(`Export table ${table} must be an array.`);
    bundle.tables[table] = rows;
  }
  const objects = bundle.storage?.objects ?? [];
  if (!Array.isArray(objects)) throw new Error("Export storage.objects must be an array.");
  bundle.storage = { ...(bundle.storage ?? {}), objects };

  return { bundle, bundleDir, bundlePath };
}

export function prepareSupabaseImport({ bundle, bundleDir, targetOwnerUserId }) {
  const sourceOwnerUserId = requiredText(bundle.source.owner_user_id, "source.owner_user_id");
  const importedAt = isoTimestamp(bundle.exported_at ?? new Date().toISOString(), "exported_at");
  const warnings = [];

  for (const table of tableNames) {
    for (const [index, row] of bundle.tables[table].entries()) {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        throw new Error(`${table}[${index}] must be an object.`);
      }
      if ("user_id" in row && row.user_id !== sourceOwnerUserId) {
        throw new Error(`${table}[${index}].user_id is outside source owner scope.`);
      }
    }
  }

  const clients = bundle.tables.clients.map((row, index) => ({
    id: requiredText(row.id, `clients[${index}].id`),
    owner_user_id: targetOwnerUserId,
    auth_user_id: null,
    name: requiredText(row.name, `clients[${index}].name`),
    company_name: optionalText(row.company_name),
    email: optionalText(row.email),
    phone: optionalText(row.phone),
    website: optionalText(row.website),
    status: enumValue(row.status ?? "active", enumValues.clientStatus, `clients[${index}].status`),
    pipeline_stage: enumValue(
      row.pipeline_stage ?? "lead",
      enumValues.pipelineStage,
      `clients[${index}].pipeline_stage`,
    ),
    next_follow_up_date: dateValue(row.next_follow_up_date, `clients[${index}].next_follow_up_date`),
    notes: optionalText(row.notes),
    created_at: timestampMs(row.created_at ?? importedAt, `clients[${index}].created_at`),
    updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `clients[${index}].updated_at`),
  }));
  const clientIds = uniqueIds(clients, "clients");

  const journalByDate = new Map();
  const journalIdMap = new Map();
  for (const [index, row] of bundle.tables.daily_logs.entries()) {
    const entryDate = dateValue(row.log_date, `daily_logs[${index}].log_date`, true);
    const entry = {
      id: requiredText(row.id, `daily_logs[${index}].id`),
      owner_user_id: targetOwnerUserId,
      entry_date: entryDate,
      mood_score: score(row.mood_score, `daily_logs[${index}].mood_score`, true),
      energy_score: score(row.energy_score, `daily_logs[${index}].energy_score`, true),
      work_satisfaction_score: score(
        row.work_satisfaction_score,
        `daily_logs[${index}].work_satisfaction_score`,
      ),
      mood_label: null,
      note: optionalText(row.note),
      legacy_ai_metadata: null,
      created_at: timestampMs(row.created_at ?? importedAt, `daily_logs[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `daily_logs[${index}].updated_at`),
    };
    if (journalByDate.has(entryDate)) throw new Error(`daily_logs contains duplicate date ${entryDate}.`);
    journalByDate.set(entryDate, entry);
    journalIdMap.set(entry.id, entry.id);
  }
  for (const [index, row] of bundle.tables.journals.entries()) {
    const sourceId = requiredText(row.id, `journals[${index}].id`);
    const entryDate = dateValue(row.date, `journals[${index}].date`, true);
    const legacyMetadata = compactObject({
      aiTags: arrayOfText(row.ai_tags, `journals[${index}].ai_tags`),
      aiSentimentScore: row.ai_sentiment_score ?? null,
      aiSummary: optionalText(row.ai_summary),
      aiReflection: optionalText(row.ai_reflection),
      analysisStatus: optionalText(row.analysis_status),
      sourceJournalId: sourceId,
    });
    const existing = journalByDate.get(entryDate);
    if (existing) {
      existing.note = mergeJournalNotes(existing.note, optionalText(row.content));
      existing.mood_label ||= optionalText(row.mood);
      existing.legacy_ai_metadata = JSON.stringify({
        ...(existing.legacy_ai_metadata ? JSON.parse(existing.legacy_ai_metadata) : {}),
        ...legacyMetadata,
      });
      existing.updated_at = Math.max(
        existing.updated_at,
        timestampMs(row.updated_at ?? row.created_at ?? importedAt, `journals[${index}].updated_at`),
      );
      journalIdMap.set(sourceId, existing.id);
    } else {
      const entry = {
        id: sourceId,
        owner_user_id: targetOwnerUserId,
        entry_date: entryDate,
        mood_score: null,
        energy_score: score(row.energy, `journals[${index}].energy`),
        work_satisfaction_score: null,
        mood_label: optionalText(row.mood),
        note: optionalText(row.content),
        legacy_ai_metadata: JSON.stringify(legacyMetadata),
        created_at: timestampMs(row.created_at ?? importedAt, `journals[${index}].created_at`),
        updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `journals[${index}].updated_at`),
      };
      journalByDate.set(entryDate, entry);
      journalIdMap.set(sourceId, sourceId);
    }
  }
  const journalEntries = [...journalByDate.values()].sort((left, right) =>
    left.entry_date.localeCompare(right.entry_date)
  );

  const projects = bundle.tables.projects.map((row, index) => {
    const clientId = optionalId(row.client_id);
    assertForeignKey(clientId, clientIds, `projects[${index}].client_id`);
    return {
      id: requiredText(row.id, `projects[${index}].id`),
      owner_user_id: targetOwnerUserId,
      client_id: clientId,
      name: requiredText(row.name, `projects[${index}].name`),
      type: enumValue(row.type ?? "client_project", enumValues.projectType, `projects[${index}].type`),
      description: optionalText(row.description),
      status: enumValue(row.status ?? "planning", enumValues.projectStatus, `projects[${index}].status`),
      start_date: dateValue(row.start_date, `projects[${index}].start_date`),
      due_date: dateValue(row.due_date, `projects[${index}].due_date`),
      budget_amount_minor: moneyMinor(row.budget_amount, `projects[${index}].budget_amount`),
      currency: currency(row.currency ?? "USD", `projects[${index}].currency`),
      progress: boundedInteger(row.progress ?? 0, 0, 100, `projects[${index}].progress`),
      progress_type: enumValue(
        row.progress_type ?? "manual",
        enumValues.progressType,
        `projects[${index}].progress_type`,
      ),
      revision_quota: boundedInteger(
        row.revision_quota ?? 0,
        0,
        Number.MAX_SAFE_INTEGER,
        `projects[${index}].revision_quota`,
      ),
      legacy_cover_image_path: optionalText(row.cover_image_path),
      cover_image_alt: optionalText(row.cover_image_alt),
      created_at: timestampMs(row.created_at ?? importedAt, `projects[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `projects[${index}].updated_at`),
    };
  });
  const projectIds = uniqueIds(projects, "projects");

  const storage = prepareStorageObjects({
    objects: bundle.storage.objects,
    bundleDir,
    targetOwnerUserId,
    projectIds,
    sourceOwnerUserId,
    importedAt,
  });
  const assetReplacements = new Map();
  for (const item of storage) {
    for (const alias of item.aliases) assetReplacements.set(alias, `/api/files/${item.row.id}`);
  }
  for (const project of projects) {
    if (project.legacy_cover_image_path && assetReplacements.has(project.legacy_cover_image_path)) {
      project.legacy_cover_image_path = assetReplacements.get(project.legacy_cover_image_path);
    }
  }

  const tasks = bundle.tables.tasks.map((row, index) => {
    const status = row.status === "completed" ? "done" : row.status ?? "todo";
    const clientId = optionalId(row.client_id);
    const projectId = optionalId(row.project_id);
    const sourceJournalId = optionalId(row.source_journal_id);
    assertForeignKey(clientId, clientIds, `tasks[${index}].client_id`);
    assertForeignKey(projectId, projectIds, `tasks[${index}].project_id`);
    if (sourceJournalId && !journalIdMap.has(sourceJournalId)) {
      throw new Error(`tasks[${index}].source_journal_id references missing journal ${sourceJournalId}.`);
    }
    return {
      id: requiredText(row.id, `tasks[${index}].id`),
      owner_user_id: targetOwnerUserId,
      client_id: clientId,
      project_id: projectId,
      source_journal_entry_id: sourceJournalId ? journalIdMap.get(sourceJournalId) : null,
      title: requiredText(row.title, `tasks[${index}].title`),
      description: optionalText(row.description),
      status: enumValue(status, enumValues.taskStatus, `tasks[${index}].status`),
      priority: enumValue(row.priority ?? "medium", enumValues.priority, `tasks[${index}].priority`),
      scheduled_date: dateValue(row.date, `tasks[${index}].date`),
      due_at: timestampMs(row.due_at, `tasks[${index}].due_at`, false),
      estimated_minutes: nonNegativeInteger(row.estimated_minutes, `tasks[${index}].estimated_minutes`),
      actual_minutes: nonNegativeInteger(row.actual_minutes, `tasks[${index}].actual_minutes`),
      ai_generated: booleanInteger(row.ai_generated),
      is_public_to_client: booleanInteger(row.is_public_to_client),
      created_at: timestampMs(row.created_at ?? importedAt, `tasks[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `tasks[${index}].updated_at`),
    };
  });
  const taskIds = uniqueIds(tasks, "tasks");

  const calendarEvents = bundle.tables.calendar_events.map((row, index) => {
    const clientId = optionalId(row.client_id);
    const projectId = optionalId(row.project_id);
    const taskId = optionalId(row.task_id);
    assertForeignKey(clientId, clientIds, `calendar_events[${index}].client_id`);
    assertForeignKey(projectId, projectIds, `calendar_events[${index}].project_id`);
    assertForeignKey(taskId, taskIds, `calendar_events[${index}].task_id`);
    const startsAt = timestampMs(row.starts_at, `calendar_events[${index}].starts_at`);
    const endsAt = timestampMs(row.ends_at, `calendar_events[${index}].ends_at`, false);
    if (endsAt != null && endsAt < startsAt) {
      throw new Error(`calendar_events[${index}].ends_at is before starts_at.`);
    }
    return {
      id: requiredText(row.id, `calendar_events[${index}].id`),
      owner_user_id: targetOwnerUserId,
      client_id: clientId,
      project_id: projectId,
      task_id: taskId,
      title: requiredText(row.title, `calendar_events[${index}].title`),
      description: optionalText(row.description),
      type: enumValue(row.type ?? "focus", enumValues.eventType, `calendar_events[${index}].type`),
      starts_at: startsAt,
      ends_at: endsAt,
      created_at: timestampMs(row.created_at ?? importedAt, `calendar_events[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `calendar_events[${index}].updated_at`),
    };
  });

  const financeTransactions = bundle.tables.finance_transactions.map((row, index) => {
    const clientId = optionalId(row.client_id);
    const projectId = optionalId(row.project_id);
    assertForeignKey(clientId, clientIds, `finance_transactions[${index}].client_id`);
    assertForeignKey(projectId, projectIds, `finance_transactions[${index}].project_id`);
    return {
      id: requiredText(row.id, `finance_transactions[${index}].id`),
      owner_user_id: targetOwnerUserId,
      client_id: clientId,
      project_id: projectId,
      type: enumValue(row.type, enumValues.financeType, `finance_transactions[${index}].type`),
      amount_minor: moneyMinor(row.amount, `finance_transactions[${index}].amount`, false),
      currency: currency(row.currency ?? "USD", `finance_transactions[${index}].currency`),
      transaction_date: dateValue(
        row.transaction_date,
        `finance_transactions[${index}].transaction_date`,
        true,
      ),
      category: optionalText(row.category),
      payment_status: enumValue(
        row.payment_status ?? "planned",
        enumValues.paymentStatus,
        `finance_transactions[${index}].payment_status`,
      ),
      description: optionalText(row.description),
      created_at: timestampMs(row.created_at ?? importedAt, `finance_transactions[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `finance_transactions[${index}].updated_at`),
    };
  });

  const clientActivities = bundle.tables.client_activities.map((row, index) => {
    const clientId = requiredText(row.client_id, `client_activities[${index}].client_id`);
    assertForeignKey(clientId, clientIds, `client_activities[${index}].client_id`);
    return {
      id: requiredText(row.id, `client_activities[${index}].id`),
      owner_user_id: targetOwnerUserId,
      client_id: clientId,
      type: enumValue(row.type, enumValues.activityType, `client_activities[${index}].type`),
      title: requiredText(row.title, `client_activities[${index}].title`),
      content: optionalText(row.content),
      activity_date: timestampMs(
        row.activity_date ?? row.created_at ?? importedAt,
        `client_activities[${index}].activity_date`,
      ),
      created_at: timestampMs(row.created_at ?? importedAt, `client_activities[${index}].created_at`),
    };
  });

  const planningSections = bundle.tables.project_planning_sections.map((row, index) => {
    const projectId = requiredText(row.project_id, `project_planning_sections[${index}].project_id`);
    assertForeignKey(projectId, projectIds, `project_planning_sections[${index}].project_id`);
    return {
      id: requiredText(row.id, `project_planning_sections[${index}].id`),
      owner_user_id: targetOwnerUserId,
      project_id: projectId,
      category: enumValue(
        row.category,
        enumValues.planningCategory,
        `project_planning_sections[${index}].category`,
      ),
      title: requiredText(row.title, `project_planning_sections[${index}].title`),
      content: replaceAssetReferences(optionalText(row.content), assetReplacements),
      metadata: JSON.stringify(replaceAssetReferences(jsonObject(row.metadata), assetReplacements)),
      sort_order: boundedInteger(
        row.sort_order ?? 0,
        0,
        Number.MAX_SAFE_INTEGER,
        `project_planning_sections[${index}].sort_order`,
      ),
      created_at: timestampMs(row.created_at ?? importedAt, `project_planning_sections[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `project_planning_sections[${index}].updated_at`),
    };
  });

  const projectRevisions = bundle.tables.project_revisions.map((row, index) => {
    const projectId = requiredText(row.project_id, `project_revisions[${index}].project_id`);
    const clientId = requiredText(row.client_id, `project_revisions[${index}].client_id`);
    assertForeignKey(projectId, projectIds, `project_revisions[${index}].project_id`);
    assertForeignKey(clientId, clientIds, `project_revisions[${index}].client_id`);
    return {
      id: requiredText(row.id, `project_revisions[${index}].id`),
      owner_user_id: targetOwnerUserId,
      project_id: projectId,
      client_id: clientId,
      requested_by_user_id: targetOwnerUserId,
      description: requiredText(row.description, `project_revisions[${index}].description`),
      status: enumValue(
        row.status ?? "pending",
        enumValues.revisionStatus,
        `project_revisions[${index}].status`,
      ),
      created_at: timestampMs(row.created_at ?? importedAt, `project_revisions[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `project_revisions[${index}].updated_at`),
    };
  });
  if (projectRevisions.length > 0) {
    warnings.push(
      `${projectRevisions.length} historical revision requester was mapped to the target owner; client accounts must be re-invited.`,
    );
  }

  const chatSessions = bundle.tables.chat_sessions.map((row, index) => ({
    id: requiredText(row.id, `chat_sessions[${index}].id`),
    owner_user_id: targetOwnerUserId,
    title: requiredText(row.title, `chat_sessions[${index}].title`),
    created_at: timestampMs(row.created_at ?? importedAt, `chat_sessions[${index}].created_at`),
    updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `chat_sessions[${index}].updated_at`),
  }));
  const chatSessionIds = uniqueIds(chatSessions, "chat_sessions");

  const journalTargetIds = new Set(journalEntries.map((entry) => entry.id));
  const chatMessages = bundle.tables.chat_messages.map((row, index) => {
    const sessionId = requiredText(row.session_id, `chat_messages[${index}].session_id`);
    assertForeignKey(sessionId, chatSessionIds, `chat_messages[${index}].session_id`);
    const contextIds = arrayOfText(
      row.context_journal_ids,
      `chat_messages[${index}].context_journal_ids`,
    ).map((id) => journalIdMap.get(id) ?? id);
    for (const id of contextIds) assertForeignKey(id, journalTargetIds, `chat_messages[${index}].context_journal_ids`);
    return {
      id: requiredText(row.id, `chat_messages[${index}].id`),
      session_id: sessionId,
      role: enumValue(row.role, enumValues.chatRole, `chat_messages[${index}].role`),
      content: requiredText(row.content, `chat_messages[${index}].content`),
      context_journal_entry_ids: JSON.stringify([...new Set(contextIds)]),
      created_at: timestampMs(row.created_at ?? importedAt, `chat_messages[${index}].created_at`),
    };
  });

  const proposals = bundle.tables.proposals.map((row, index) => {
    const clientId = optionalId(row.client_id);
    const projectId = optionalId(row.project_id);
    assertForeignKey(clientId, clientIds, `proposals[${index}].client_id`);
    assertForeignKey(projectId, projectIds, `proposals[${index}].project_id`);
    return {
      id: requiredText(row.id, `proposals[${index}].id`),
      owner_user_id: targetOwnerUserId,
      client_id: clientId,
      project_id: projectId,
      title: requiredText(row.title, `proposals[${index}].title`),
      description: optionalText(row.description),
      amount_minor: moneyMinor(row.amount ?? 0, `proposals[${index}].amount`, false),
      currency: currency(row.currency ?? "TRY", `proposals[${index}].currency`),
      status: enumValue(row.status ?? "draft", enumValues.proposalStatus, `proposals[${index}].status`),
      valid_until: timestampMs(row.valid_until, `proposals[${index}].valid_until`, false),
      created_at: timestampMs(row.created_at ?? importedAt, `proposals[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `proposals[${index}].updated_at`),
    };
  });
  const proposalIds = uniqueIds(proposals, "proposals");

  const contracts = bundle.tables.contracts.map((row, index) => {
    const proposalId = optionalId(row.proposal_id);
    const clientId = optionalId(row.client_id);
    assertForeignKey(proposalId, proposalIds, `contracts[${index}].proposal_id`);
    assertForeignKey(clientId, clientIds, `contracts[${index}].client_id`);
    return {
      id: requiredText(row.id, `contracts[${index}].id`),
      owner_user_id: targetOwnerUserId,
      proposal_id: proposalId,
      client_id: clientId,
      title: requiredText(row.title, `contracts[${index}].title`),
      content: optionalText(row.content),
      status: enumValue(row.status ?? "draft", enumValues.contractStatus, `contracts[${index}].status`),
      signed_at: timestampMs(row.signed_at, `contracts[${index}].signed_at`, false),
      created_at: timestampMs(row.created_at ?? importedAt, `contracts[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `contracts[${index}].updated_at`),
    };
  });

  const invoices = bundle.tables.invoices.map((row, index) => {
    const clientId = optionalId(row.client_id);
    const projectId = optionalId(row.project_id);
    assertForeignKey(clientId, clientIds, `invoices[${index}].client_id`);
    assertForeignKey(projectId, projectIds, `invoices[${index}].project_id`);
    return {
      id: requiredText(row.id, `invoices[${index}].id`),
      owner_user_id: targetOwnerUserId,
      client_id: clientId,
      project_id: projectId,
      invoice_number: requiredText(row.invoice_number, `invoices[${index}].invoice_number`),
      amount_minor: moneyMinor(row.amount ?? 0, `invoices[${index}].amount`, false),
      tax_basis_points: percentageBasisPoints(row.tax_rate ?? 0, `invoices[${index}].tax_rate`),
      currency: currency(row.currency ?? "TRY", `invoices[${index}].currency`),
      status: enumValue(row.status ?? "draft", enumValues.invoiceStatus, `invoices[${index}].status`),
      issue_date: dateValue(
        row.issue_date ?? row.created_at ?? importedAt,
        `invoices[${index}].issue_date`,
        true,
      ),
      due_date: dateValue(row.due_date, `invoices[${index}].due_date`),
      paid_at: timestampMs(row.paid_at, `invoices[${index}].paid_at`, false),
      created_at: timestampMs(row.created_at ?? importedAt, `invoices[${index}].created_at`),
      updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `invoices[${index}].updated_at`),
    };
  });

  const subscriptions = bundle.tables.subscriptions.map((row, index) => ({
    id: requiredText(row.id, `subscriptions[${index}].id`),
    owner_user_id: targetOwnerUserId,
    name: requiredText(row.name, `subscriptions[${index}].name`),
    amount_minor: moneyMinor(row.amount ?? 0, `subscriptions[${index}].amount`, false),
    currency: currency(row.currency ?? "TRY", `subscriptions[${index}].currency`),
    billing_cycle: enumValue(
      row.billing_cycle ?? "monthly",
      enumValues.billingCycle,
      `subscriptions[${index}].billing_cycle`,
    ),
    next_billing_date: dateValue(row.next_billing_date, `subscriptions[${index}].next_billing_date`),
    status: enumValue(
      row.status ?? "active",
      enumValues.subscriptionStatus,
      `subscriptions[${index}].status`,
    ),
    category: optionalText(row.category),
    created_at: timestampMs(row.created_at ?? importedAt, `subscriptions[${index}].created_at`),
    updated_at: timestampMs(row.updated_at ?? row.created_at ?? importedAt, `subscriptions[${index}].updated_at`),
  }));

  const settingsRow = bundle.tables.app_settings[0] ?? null;
  if (bundle.tables.app_settings.length > 1) {
    throw new Error("app_settings must contain at most one owner-scoped row.");
  }
  const preferences = settingsRow
    ? {
        owner_user_id: targetOwnerUserId,
        timezone: requiredText(settingsRow.timezone ?? "UTC", "app_settings[0].timezone"),
        default_currency: currency(settingsRow.currency ?? "USD", "app_settings[0].currency"),
        language: "tr",
        date_format: "dd.MM.yyyy",
        color_mode: "system",
        sidebar_collapsed: 0,
        created_at: isoTimestamp(settingsRow.created_at ?? importedAt, "app_settings[0].created_at"),
        updated_at: isoTimestamp(settingsRow.updated_at ?? settingsRow.created_at ?? importedAt, "app_settings[0].updated_at"),
      }
    : null;
  const aiSettings = settingsRow
    ? {
        owner_user_id: targetOwnerUserId,
        provider: normalizeAiProvider(settingsRow.ai_provider),
        model: optionalText(settingsRow.ai_model),
        created_at: isoTimestamp(settingsRow.created_at ?? importedAt, "app_settings[0].created_at"),
        updated_at: isoTimestamp(settingsRow.updated_at ?? settingsRow.created_at ?? importedAt, "app_settings[0].updated_at"),
      }
    : null;
  if (settingsRow?.api_key && String(settingsRow.api_key).trim()) {
    warnings.push("Legacy app_settings.api_key was intentionally not imported.");
  }
  if (bundle.tables.document_embeddings.length > 0) {
    warnings.push(
      `${bundle.tables.document_embeddings.length} document_embeddings rows were intentionally archived outside runtime import.`,
    );
  }
  if (clients.some((row) => row.auth_user_id == null) && bundle.tables.clients.some((row) => row.client_auth_id)) {
    warnings.push("Legacy client auth links were cleared; client accounts must be re-invited.");
  }

  const ownerProfile = bundle.tables.profiles.find((row) => row.id === sourceOwnerUserId) ?? null;
  const ownerDisplayName = ownerProfile
    ? [optionalText(ownerProfile.first_name), optionalText(ownerProfile.last_name)].filter(Boolean).join(" ")
    : null;

  const tables = {
    clients,
    journal_entries: journalEntries,
    projects,
    tasks,
    calendar_events: calendarEvents,
    finance_transactions: financeTransactions,
    client_activities: clientActivities,
    project_planning_sections: planningSections,
    project_revisions: projectRevisions,
    chat_sessions: chatSessions,
    chat_messages: chatMessages,
    proposals,
    contracts,
    invoices,
    subscriptions,
  };
  for (const [name, rows] of Object.entries(tables)) uniqueIds(rows, name);

  return {
    sourceOwnerUserId,
    targetOwnerUserId,
    importedAt,
    ownerDisplayName,
    tables,
    storage,
    preferences,
    aiSettings,
    warnings,
    sourceCounts: Object.fromEntries(tableNames.map((name) => [name, bundle.tables[name].length])),
    targetCounts: {
      ...Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])),
      files: storage.length,
      user_preferences: preferences ? 1 : 0,
      user_ai_settings: aiSettings ? 1 : 0,
    },
  };
}

export function validateTargetOwner(db, targetOwnerUserId) {
  const owner = db.prepare(`
    select u.id, u.email, p.role
    from user u
    inner join app_profiles p on p.auth_user_id = u.id
    where u.id = ?
  `).get(targetOwnerUserId);
  if (!owner || owner.role !== "freelancer") {
    throw new Error("Target owner must be an existing Better Auth freelancer profile.");
  }
  return owner;
}

export function assertTargetImportSafety(db, plan, allowExisting) {
  const domainTables = Object.keys(plan.tables);
  const existing = Object.fromEntries(
    domainTables.map((table) => [
      table,
      db.prepare(`select count(*) as value from "${table}" where ${table === "chat_messages" ? "session_id in (select id from chat_sessions where owner_user_id = ?)" : table === "project_revisions" || table === "project_planning_sections" || table === "client_activities" ? "owner_user_id = ?" : table === "journal_entries" || table === "calendar_events" || table === "finance_transactions" || table === "chat_sessions" || table === "clients" || table === "projects" || table === "tasks" || table === "proposals" || table === "contracts" || table === "invoices" || table === "subscriptions" ? "owner_user_id = ?" : "1 = 0"}`)
        .get(plan.targetOwnerUserId).value,
    ]),
  );
  const total = Object.values(existing).reduce((sum, value) => sum + Number(value), 0);
  if (total > 0 && !allowExisting) {
    throw new Error(
      `Target already contains ${total} owner domain rows. Re-run with --allow-existing for idempotent upsert.`,
    );
  }
  return existing;
}

export function stageImportFiles(plan, uploadsDir) {
  const createdPaths = [];
  for (const item of plan.storage) {
    const targetPath = resolveWithin(uploadsDir, item.row.storage_path);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (fs.existsSync(targetPath)) {
      const actualHash = hashFile(targetPath);
      if (actualHash !== item.row.sha256) {
        throw new Error(`Existing target file checksum mismatch: ${item.row.storage_path}`);
      }
      continue;
    }
    fs.copyFileSync(item.sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
    fs.chmodSync(targetPath, 0o600);
    createdPaths.push(targetPath);
  }
  return createdPaths;
}

export function rollbackStagedFiles(paths) {
  for (const filePath of paths.reverse()) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

export function applySupabaseImport(db, plan) {
  const write = db.transaction(() => {
    for (const [table, rows] of Object.entries(plan.tables)) {
      for (const row of rows) upsertRow(db, table, row, ["id"]);
    }
    for (const item of plan.storage) upsertRow(db, "files", item.row, ["id"]);

    if (plan.preferences) upsertRow(db, "user_preferences", plan.preferences, ["owner_user_id"]);
    if (plan.aiSettings) {
      db.prepare(`
        insert into user_ai_settings (
          owner_user_id, provider, model, encrypted_api_key, created_at, updated_at
        ) values (
          @owner_user_id, @provider, @model, null, @created_at, @updated_at
        )
        on conflict(owner_user_id) do update set
          provider = case when user_ai_settings.encrypted_api_key is null then excluded.provider else user_ai_settings.provider end,
          model = case when user_ai_settings.encrypted_api_key is null then excluded.model else user_ai_settings.model end,
          updated_at = excluded.updated_at
      `).run(plan.aiSettings);
    }
    if (plan.ownerDisplayName) {
      db.prepare("update user set name = ?, updated_at = ? where id = ?")
        .run(plan.ownerDisplayName, Date.now(), plan.targetOwnerUserId);
      db.prepare("update app_profiles set display_name = ?, updated_at = ? where auth_user_id = ?")
        .run(plan.ownerDisplayName, Date.now(), plan.targetOwnerUserId);
    }

    const avatar = plan.storage.find((item) => item.row.kind === "avatar");
    if (avatar) {
      db.prepare("update user set image = ?, updated_at = ? where id = ?")
        .run(`/api/files/${avatar.row.id}`, Date.now(), plan.targetOwnerUserId);
    }
    for (const item of plan.storage) {
      for (const reference of item.references) {
        if (reference.type === "project_cover") {
          db.prepare(`
            update projects
            set legacy_cover_image_path = ?, updated_at = ?
            where id = ? and owner_user_id = ?
          `).run(
            `/api/files/${item.row.id}`,
            Date.now(),
            reference.project_id,
            plan.targetOwnerUserId,
          );
        }
      }
    }
  });
  write.immediate();

  const verification = {};
  for (const [table, rows] of Object.entries(plan.tables)) {
    verification[table] = verifyImportedIds(db, table, rows.map((row) => row.id));
  }
  verification.files = verifyImportedIds(db, "files", plan.storage.map((item) => item.row.id));
  return verification;
}

function prepareStorageObjects({
  objects,
  bundleDir,
  targetOwnerUserId,
  projectIds,
  sourceOwnerUserId,
  importedAt,
}) {
  let avatarCount = 0;
  return objects.map((entry, index) => {
    const label = `storage.objects[${index}]`;
    const bucket = enumValue(entry.bucket, ["avatars", "project-assets"], `${label}.bucket`);
    const objectPath = safeObjectPath(entry.object_path, `${label}.object_path`);
    const localPath = safeRelativePath(entry.local_path, `${label}.local_path`);
    const sourcePath = resolveWithin(bundleDir, localPath);
    const stat = fs.lstatSync(sourcePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label}.local_path is not a regular file.`);
    if (stat.size === 0 || stat.size > 5 * 1024 * 1024) {
      throw new Error(`${label} must be between 1 byte and 5 MiB.`);
    }
    const sha256 = requiredText(entry.sha256, `${label}.sha256`).toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(sha256) || hashFile(sourcePath) !== sha256) {
      throw new Error(`${label} checksum mismatch.`);
    }
    if (entry.bytes !== stat.size) throw new Error(`${label}.bytes mismatch.`);
    const projectId = bucket === "project-assets"
      ? requiredText(entry.project_id, `${label}.project_id`)
      : null;
    assertForeignKey(projectId, projectIds, `${label}.project_id`);
    if (bucket === "avatars") {
      avatarCount += 1;
      if (avatarCount > 1) throw new Error("Only one owner avatar may be imported.");
    }
    const mimeType = validateImageFile(sourcePath, entry.mime_type, label);
    const extension = extensionForMime(mimeType);
    const id = `import-${crypto.createHash("sha256")
      .update(`${bucket}:${objectPath}:${projectId ?? sourceOwnerUserId}`)
      .digest("hex")
      .slice(0, 24)}`;
    const directory = bucket === "avatars" ? "avatars" : "project-assets";
    const references = Array.isArray(entry.references) ? entry.references.map((reference, refIndex) => {
      if (reference?.type !== "project_cover") {
        throw new Error(`${label}.references[${refIndex}] has unsupported type.`);
      }
      const referenceProjectId = requiredText(
        reference.project_id,
        `${label}.references[${refIndex}].project_id`,
      );
      assertForeignKey(referenceProjectId, projectIds, `${label}.references[${refIndex}].project_id`);
      if (referenceProjectId !== projectId) {
        throw new Error(`${label}.references[${refIndex}] project does not match storage project_id.`);
      }
      return { type: "project_cover", project_id: referenceProjectId };
    }) : [];
    const aliases = [
      objectPath,
      optionalText(entry.source_url),
      ...(Array.isArray(entry.aliases) ? entry.aliases.map((alias) => requiredText(alias, `${label}.aliases`)) : []),
    ].filter(Boolean);
    return {
      sourcePath,
      references,
      aliases,
      row: {
        id,
        owner_user_id: targetOwnerUserId,
        uploaded_by_user_id: targetOwnerUserId,
        auth_user_id: bucket === "avatars" ? targetOwnerUserId : null,
        project_id: projectId,
        kind: bucket === "avatars" ? "avatar" : "project_asset",
        visibility: bucket === "avatars" ? "private" : booleanInteger(entry.portal_visible) ? "portal" : "private",
        storage_path: `${directory}/${id}.${extension}`,
        original_name: path.basename(entry.original_name ?? objectPath),
        mime_type: mimeType,
        byte_size: stat.size,
        sha256,
        created_at: timestampMs(entry.created_at ?? importedAt, `${label}.created_at`),
        updated_at: timestampMs(entry.updated_at ?? entry.created_at ?? importedAt, `${label}.updated_at`),
      },
    };
  });
}

function upsertRow(db, table, row, conflictColumns) {
  const columns = Object.keys(row);
  const updates = columns.filter((column) => !conflictColumns.includes(column));
  const quotedColumns = columns.map(quoteIdentifier).join(", ");
  const placeholders = columns.map((column) => `@${column}`).join(", ");
  const conflict = conflictColumns.map(quoteIdentifier).join(", ");
  const updateSql = updates.map((column) =>
    `${quoteIdentifier(column)} = excluded.${quoteIdentifier(column)}`
  ).join(", ");
  db.prepare(`
    insert into ${quoteIdentifier(table)} (${quotedColumns})
    values (${placeholders})
    on conflict(${conflict}) do update set ${updateSql}
  `).run(row);
}

function verifyImportedIds(db, table, ids) {
  if (ids.length === 0) return 0;
  const statement = db.prepare(`select 1 as value from ${quoteIdentifier(table)} where id = ?`);
  for (const id of ids) {
    if (!statement.get(id)) throw new Error(`Post-import verification failed for ${table}:${id}.`);
  }
  return ids.length;
}

function uniqueIds(rows, label) {
  const values = new Set();
  for (const row of rows) {
    if (values.has(row.id)) throw new Error(`${label} contains duplicate id ${row.id}.`);
    values.add(row.id);
  }
  return values;
}

function assertForeignKey(value, ids, label) {
  if (value != null && !ids.has(value)) throw new Error(`${label} references missing id ${value}.`);
}

function enumValue(value, allowed, label) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`${label} has unknown value ${JSON.stringify(value)}.`);
  }
  return value;
}

function normalizeAiProvider(value) {
  const normalized = value === "google" ? "gemini" : value ?? "ollama";
  return enumValue(normalized, enumValues.aiProvider, "app_settings[0].ai_provider");
}

function requiredText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function optionalText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function optionalId(value) {
  return optionalText(value);
}

function currency(value, label) {
  const normalized = requiredText(String(value), label).toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error(`${label} must be a 3-letter currency.`);
  return normalized;
}

function moneyMinor(value, label, nullable = true) {
  if (value == null || value === "") {
    if (nullable) return null;
    throw new Error(`${label} is required.`);
  }
  const minor = decimalScale(value, 2, label);
  if (minor < 0) throw new Error(`${label} cannot be negative.`);
  return minor;
}

function percentageBasisPoints(value, label) {
  const points = decimalScale(value, 2, label);
  if (points < 0 || points > 10_000) throw new Error(`${label} must be between 0 and 100.`);
  return points;
}

function decimalScale(value, scale, label) {
  const text = String(value).trim();
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match || (match[3]?.length ?? 0) > scale) {
    throw new Error(`${label} must have at most ${scale} decimal places.`);
  }
  const sign = match[1] === "-" ? -1 : 1;
  const fraction = (match[3] ?? "").padEnd(scale, "0");
  const result = sign * (Number(match[2]) * 10 ** scale + Number(fraction || 0));
  if (!Number.isSafeInteger(result)) throw new Error(`${label} is outside safe integer range.`);
  return result;
}

function boundedInteger(value, min, max, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}.`);
  }
  return number;
}

function nonNegativeInteger(value, label) {
  if (value == null || value === "") return null;
  return boundedInteger(value, 0, Number.MAX_SAFE_INTEGER, label);
}

function score(value, label, required = false) {
  if (value == null || value === "") {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  return boundedInteger(value, 1, 5, label);
}

function booleanInteger(value) {
  return value === true || value === 1 || value === "true" ? 1 : 0;
}

function dateValue(value, label, required = false) {
  if (value == null || value === "") {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is not a valid date.`);
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : date.toISOString().slice(0, 10);
}

function timestampMs(value, label, required = true) {
  if (value == null || value === "") {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is not a valid timestamp.`);
  return date.getTime();
}

function isoTimestamp(value, label) {
  const milliseconds = timestampMs(value, label);
  return new Date(milliseconds).toISOString();
}

function arrayOfText(value, label) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function jsonObject(value) {
  if (value == null) return {};
  if (typeof value === "string") {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Planning metadata must be a JSON object.");
    }
    return parsed;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Planning metadata must be a JSON object.");
  }
  return value;
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) =>
    item != null && (!Array.isArray(item) || item.length > 0)
  ));
}

function mergeJournalNotes(dailyNote, journalContent) {
  if (!journalContent) return dailyNote;
  if (!dailyNote) return journalContent;
  if (dailyNote.includes(journalContent)) return dailyNote;
  return `${dailyNote}\n\n[Legacy journal]\n${journalContent}`;
}

function replaceAssetReferences(value, replacements) {
  if (typeof value === "string") {
    if (replacements.has(value)) return replacements.get(value);
    let result = value;
    for (const [legacy, replacement] of replacements) {
      if (legacy && result.includes(legacy)) result = result.split(legacy).join(replacement);
    }
    return result;
  }
  if (Array.isArray(value)) return value.map((item) => replaceAssetReferences(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceAssetReferences(item, replacements)]),
    );
  }
  return value;
}

function safeObjectPath(value, label) {
  const text = requiredText(value, label).replace(/\\/g, "/");
  if (text.startsWith("/") || text.split("/").includes("..")) throw new Error(`${label} is unsafe.`);
  return text;
}

function safeRelativePath(value, label) {
  return safeObjectPath(value, label);
}

function validateImageFile(filePath, rawMimeType, label) {
  const mimeType = requiredText(rawMimeType, `${label}.mime_type`).toLowerCase();
  const bytes = fs.readFileSync(filePath);
  const ascii = (start, end) => bytes.subarray(start, end).toString("ascii");
  const valid = (
    (mimeType === "image/png"
      && bytes.length >= 8
      && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    || (mimeType === "image/jpeg" && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    || (mimeType === "image/webp" && bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")
    || (mimeType === "image/gif" && ["GIF87a", "GIF89a"].includes(ascii(0, 6)))
  );
  if (!valid) throw new Error(`${label} content does not match its supported image MIME type.`);
  return mimeType;
}

function extensionForMime(mimeType) {
  return {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  }[mimeType];
}

function resolveWithin(root, relativePath) {
  const normalizedRoot = path.resolve(root);
  const resolved = path.resolve(normalizedRoot, relativePath);
  if (!resolved.startsWith(`${normalizedRoot}${path.sep}`)) {
    throw new Error(`Path escapes root: ${relativePath}`);
  }
  return resolved;
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function quoteIdentifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error(`Unsafe SQL identifier ${value}.`);
  return `"${value}"`;
}
