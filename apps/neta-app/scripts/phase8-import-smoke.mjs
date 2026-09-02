import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const root = path.join(process.cwd(), ".data", `phase8-import-smoke-${Date.now()}`);
const dataDir = path.join(root, "data");
const exportDir = path.join(root, "export");
const databasePath = path.join(dataDir, "neta.db");
const ownerUserId = "phase8-target-owner";
const sourceOwnerUserId = "00000000-0000-4000-8000-000000000008";
const env = { ...process.env, DATA_DIR: dataDir, DATABASE_PATH: databasePath };
const rollbackDir = path.join(root, "rollback");

fs.mkdirSync(path.join(exportDir, "storage", "avatars"), { recursive: true });
fs.mkdirSync(path.join(exportDir, "storage", "project-assets"), { recursive: true });
execFileSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
db.prepare(`
  insert into user (id, name, email, email_verified, created_at, updated_at)
  values (?, ?, ?, 1, ?, ?)
`).run(ownerUserId, "Target Owner", "phase8-owner@example.com", Date.now(), Date.now());
db.prepare(`
  insert into app_profiles (auth_user_id, email, display_name, role, disabled, created_at, updated_at)
  values (?, ?, ?, 'freelancer', 0, ?, ?)
`).run(ownerUserId, "phase8-owner@example.com", "Target Owner", Date.now(), Date.now());
db.close();

execFileSync(process.execPath, ["scripts/backup.mjs"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});
const preCutoverBackupDir = fs
  .readdirSync(path.join(dataDir, "backups"))
  .map((name) => path.join(dataDir, "backups", name))
  .sort()
  .at(-1);
assert.ok(preCutoverBackupDir, "Pre-cutover backup must exist");

const avatarBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const coverBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 5, 6, 7, 8]);
const avatarLocalPath = "storage/avatars/avatar.png";
const coverLocalPath = "storage/project-assets/cover.png";
fs.writeFileSync(path.join(exportDir, avatarLocalPath), avatarBytes);
fs.writeFileSync(path.join(exportDir, coverLocalPath), coverBytes);

const baseBundle = createBundle();
writeBundle(exportDir, baseBundle);

runImport(["--dry-run"]);
let check = new Database(databasePath);
assert.equal(check.prepare("select count(*) as value from clients").get().value, 0, "Dry-run must not mutate");
check.close();

runImport([]);
runImport(["--allow-existing"]);

check = new Database(databasePath);
check.pragma("foreign_keys = ON");
try {
  assert.equal(check.prepare("select count(*) as value from clients").get().value, 1);
  assert.equal(check.prepare("select count(*) as value from projects").get().value, 1);
  assert.equal(check.prepare("select count(*) as value from files").get().value, 2);
  assert.equal(check.prepare("select count(*) as value from journal_entries").get().value, 1);
  assert.equal(
    check.prepare("select status from tasks where id = 'source-task'").get().status,
    "done",
    "Legacy completed task status must normalize to done",
  );
  assert.equal(
    check.prepare("select source_journal_entry_id as value from tasks where id = 'source-task'").get().value,
    "source-daily",
    "Merged journal references must target the canonical daily log",
  );
  assert.equal(
    check.prepare("select amount_minor as value from finance_transactions where id = 'source-finance'").get().value,
    1234,
    "Money must convert to integer minor units exactly",
  );
  assert.equal(
    check.prepare("select tax_basis_points as value from invoices where id = 'source-invoice'").get().value,
    1850,
    "Tax percentage must convert to basis points exactly",
  );
  const journal = check.prepare(`
    select note, legacy_ai_metadata as legacyAiMetadata
    from journal_entries where id = 'source-daily'
  `).get();
  assert.match(journal.note, /Daily note/);
  assert.match(journal.note, /Legacy journal content/);
  assert.match(journal.legacyAiMetadata, /source-journal/);
  const settings = check.prepare(`
    select p.timezone, p.default_currency as defaultCurrency,
           a.provider, a.model, a.encrypted_api_key as encryptedApiKey
    from user_preferences p
    inner join user_ai_settings a on a.owner_user_id = p.owner_user_id
    where p.owner_user_id = ?
  `).get(ownerUserId);
  assert.deepEqual(settings, {
    timezone: "Europe/Istanbul",
    defaultCurrency: "TRY",
    provider: "gemini",
    model: "gemini-test-model",
    encryptedApiKey: null,
  });
  assert.equal(
    check.prepare("select auth_user_id as value from clients where id = 'source-client'").get().value,
    null,
    "Legacy client auth links must not be imported",
  );
  assert.equal(
    check.prepare("select requested_by_user_id as value from project_revisions where id = 'source-revision'").get().value,
    ownerUserId,
    "Historical revision requester must use a valid target principal",
  );
  const project = check.prepare(`
    select legacy_cover_image_path as cover from projects where id = 'source-project'
  `).get();
  assert.match(project.cover, /^\/api\/files\/import-/);
  const section = check.prepare(`
    select metadata from project_planning_sections where id = 'source-section'
  `).get();
  assert.match(section.metadata, /\/api\/files\/import-/);
  assert.equal(check.prepare("select name from user where id = ?").get(ownerUserId).name, "Source Owner");
  assert.deepEqual(check.pragma("foreign_key_check"), [], "Imported database must satisfy all foreign keys");
} finally {
  check.close();
}

const reportText = fs.readFileSync(path.join(dataDir, "import-report.json"), "utf8");
assert.doesNotMatch(reportText, /legacy-plain-text-secret|source-password-secret/);
assert.match(reportText, /intentionally not imported/);

const invalidEnumDir = cloneExport("invalid-enum");
const invalidEnum = structuredClone(baseBundle);
invalidEnum.tables.tasks[0].status = "mystery";
writeBundle(invalidEnumDir, invalidEnum);
assertImportFails(invalidEnumDir, /unknown value/);

const invalidForeignKeyDir = cloneExport("invalid-foreign-key");
const invalidForeignKey = structuredClone(baseBundle);
invalidForeignKey.tables.projects[0].client_id = "missing-client";
writeBundle(invalidForeignKeyDir, invalidForeignKey);
assertImportFails(invalidForeignKeyDir, /references missing id/);

const unsafeStorageDir = cloneExport("unsafe-storage");
const unsafeStorage = structuredClone(baseBundle);
unsafeStorage.storage.objects[0].local_path = "../escape.png";
writeBundle(unsafeStorageDir, unsafeStorage);
assertImportFails(unsafeStorageDir, /unsafe|escapes root/);

execFileSync(
  process.execPath,
  [
    "scripts/restore.mjs",
    "--from",
    preCutoverBackupDir,
    "--target",
    rollbackDir,
    "--force",
  ],
  { cwd: process.cwd(), env: process.env, stdio: "inherit" },
);
const rollbackDb = new Database(path.join(rollbackDir, "neta.db"), { readonly: true });
try {
  assert.equal(
    rollbackDb.prepare("select count(*) as value from clients").get().value,
    0,
    "Rollback backup must restore the pre-import client count",
  );
  assert.equal(
    rollbackDb.prepare("select count(*) as value from user where id = ?").get(ownerUserId).value,
    1,
    "Rollback backup must preserve the Better Auth owner",
  );
} finally {
  rollbackDb.close();
}

console.log("Phase 8 import smoke passed: dry-run, normalization, files, idempotency, negative validation and rollback rehearsal verified.");

function runImport(extraArgs, from = exportDir) {
  execFileSync(
    process.execPath,
    [
      "scripts/import-supabase.mjs",
      "--from",
      from,
      "--owner-user-id",
      ownerUserId,
      ...extraArgs,
    ],
    { cwd: process.cwd(), env, stdio: "inherit" },
  );
}

function assertImportFails(from, pattern) {
  assert.throws(
    () => execFileSync(
      process.execPath,
      [
        "scripts/import-supabase.mjs",
        "--from",
        from,
        "--owner-user-id",
        ownerUserId,
        "--dry-run",
      ],
      { cwd: process.cwd(), env, stdio: "pipe" },
    ),
    (error) => pattern.test(`${error.stdout ?? ""}\n${error.stderr ?? ""}`),
  );
}

function cloneExport(name) {
  const destination = path.join(root, name);
  fs.cpSync(exportDir, destination, { recursive: true });
  return destination;
}

function writeBundle(directory, bundle) {
  fs.writeFileSync(path.join(directory, "export.json"), `${JSON.stringify(bundle, null, 2)}\n`);
}

function hash(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function createBundle() {
  const createdAt = "2026-07-17T10:00:00.000Z";
  const tableNames = [
    "profiles", "clients", "client_activities", "projects", "project_planning_sections",
    "project_revisions", "tasks", "calendar_events", "finance_transactions", "daily_logs",
    "journals", "chat_sessions", "chat_messages", "proposals", "contracts", "invoices",
    "subscriptions", "app_settings", "document_embeddings",
  ];
  const tables = Object.fromEntries(tableNames.map((name) => [name, []]));

  tables.profiles.push({
    id: sourceOwnerUserId,
    first_name: "Source",
    last_name: "Owner",
    avatar_url: "https://legacy.example/storage/v1/object/public/avatars/source/avatar.png",
  });
  tables.clients.push({
    id: "source-client", user_id: sourceOwnerUserId, client_auth_id: "legacy-client-auth-user",
    name: "Imported Client", email: "client@example.com", status: "active",
    pipeline_stage: "won", created_at: createdAt,
  });
  tables.client_activities.push({
    id: "source-activity", user_id: sourceOwnerUserId, client_id: "source-client",
    type: "meeting", title: "Imported Meeting", activity_date: createdAt, created_at: createdAt,
  });
  tables.projects.push({
    id: "source-project", user_id: sourceOwnerUserId, client_id: "source-client",
    name: "Imported Project", type: "client_project", status: "active",
    budget_amount: "1000.05", currency: "try", progress: 25, progress_type: "manual",
    revision_quota: 2, cover_image_path: "source/project-cover.png", created_at: createdAt,
  });
  tables.daily_logs.push({
    id: "source-daily", user_id: sourceOwnerUserId, log_date: "2026-07-17",
    mood_score: 4, energy_score: 3, work_satisfaction_score: 5,
    note: "Daily note", created_at: createdAt,
  });
  tables.journals.push({
    id: "source-journal", user_id: sourceOwnerUserId, date: "2026-07-17T08:00:00.000Z",
    mood: "focused", energy: 4, content: "Legacy journal content", ai_tags: ["focus"],
    ai_summary: "Legacy summary", created_at: createdAt,
  });
  tables.tasks.push({
    id: "source-task", user_id: sourceOwnerUserId, client_id: "source-client",
    project_id: "source-project", source_journal_id: "source-journal", title: "Imported Task",
    status: "completed", priority: "high", date: "2026-07-17",
    is_public_to_client: true, created_at: createdAt,
  });
  tables.calendar_events.push({
    id: "source-event", user_id: sourceOwnerUserId, client_id: "source-client",
    project_id: "source-project", task_id: "source-task", title: "Imported Event",
    type: "meeting", starts_at: createdAt, ends_at: "2026-07-17T11:00:00.000Z",
    created_at: createdAt,
  });
  tables.finance_transactions.push({
    id: "source-finance", user_id: sourceOwnerUserId, client_id: "source-client",
    project_id: "source-project", type: "income", amount: "12.34", currency: "try",
    transaction_date: "2026-07-17", payment_status: "paid", created_at: createdAt,
  });
  tables.project_planning_sections.push({
    id: "source-section", user_id: sourceOwnerUserId, project_id: "source-project",
    category: "assets", title: "Imported Assets", metadata: { cover: "source/project-cover.png" },
    sort_order: 0, created_at: createdAt,
  });
  tables.project_revisions.push({
    id: "source-revision", project_id: "source-project", client_id: "source-client",
    requested_by: "legacy-client-auth-user", description: "Imported revision",
    status: "completed", created_at: createdAt,
  });
  tables.chat_sessions.push({
    id: "source-chat", user_id: sourceOwnerUserId, title: "Imported Chat", created_at: createdAt,
  });
  tables.chat_messages.push({
    id: "source-message", session_id: "source-chat", role: "user",
    content: "Imported message", context_journal_ids: ["source-journal"], created_at: createdAt,
  });
  tables.proposals.push({
    id: "source-proposal", user_id: sourceOwnerUserId, client_id: "source-client",
    project_id: "source-project", title: "Imported Proposal", amount: "100.00",
    currency: "TRY", status: "accepted", created_at: createdAt,
  });
  tables.contracts.push({
    id: "source-contract", user_id: sourceOwnerUserId, proposal_id: "source-proposal",
    client_id: "source-client", title: "Imported Contract", status: "active", created_at: createdAt,
  });
  tables.invoices.push({
    id: "source-invoice", user_id: sourceOwnerUserId, client_id: "source-client",
    project_id: "source-project", invoice_number: "IMPORT-001", amount: "100.00",
    tax_rate: "18.50", currency: "TRY", status: "paid", issue_date: "2026-07-17",
    created_at: createdAt,
  });
  tables.subscriptions.push({
    id: "source-subscription", user_id: sourceOwnerUserId, name: "Imported Hosting",
    amount: "50.00", currency: "TRY", billing_cycle: "monthly", status: "active",
    created_at: createdAt,
  });
  tables.app_settings.push({
    id: "source-settings", user_id: sourceOwnerUserId, timezone: "Europe/Istanbul",
    currency: "TRY", ai_provider: "google", ai_model: "gemini-test-model",
    api_key: "legacy-plain-text-secret", created_at: createdAt,
  });
  tables.document_embeddings.push({
    id: "source-embedding", user_id: sourceOwnerUserId, content: "Archived only",
  });

  return {
    format: "neta-supabase-export",
    version: 1,
    exported_at: createdAt,
    source: { owner_user_id: sourceOwnerUserId },
    auth: { users: [{ password: "source-password-secret" }] },
    tables,
    storage: {
      objects: [
        {
          bucket: "avatars", object_path: "source/avatar.png",
          source_url: "https://legacy.example/storage/v1/object/public/avatars/source/avatar.png",
          local_path: avatarLocalPath, original_name: "avatar.png", mime_type: "image/png",
          bytes: avatarBytes.length, sha256: hash(avatarBytes), created_at: createdAt,
        },
        {
          bucket: "project-assets", object_path: "source/project-cover.png",
          local_path: coverLocalPath, original_name: "cover.png", mime_type: "image/png",
          bytes: coverBytes.length, sha256: hash(coverBytes), project_id: "source-project",
          portal_visible: true,
          references: [{ type: "project_cover", project_id: "source-project" }],
          created_at: createdAt,
        },
      ],
    },
  };
}
