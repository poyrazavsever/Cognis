import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const root = process.cwd();
const workRoot = path.join(root, ".data", `i18n-phase9-hardening-${Date.now()}`);
const emptyDataDir = path.join(workRoot, "empty");
const productionLikeDataDir = path.join(workRoot, "production-like");
const restoreDir = path.join(workRoot, "restore");
const failedRestoreDir = path.join(workRoot, "failed-restore");

fs.mkdirSync(workRoot, { recursive: true });

execFileSync(process.execPath, ["scripts/i18n-phase9-boundary.mjs"], {
  cwd: root,
  stdio: "inherit",
});

runEmptyMigrationRehearsal(emptyDataDir);
runProductionLikeMigrationRehearsal(productionLikeDataDir);
runBackupRestoreAndFailureRehearsal(productionLikeDataDir, restoreDir, failedRestoreDir);
assertSupabaseImportCoverage();
assertStandaloneCatalogPresence();

console.log("I18n phase 9 hardening passed: migration, backup/restore, import coverage and release boundary verified.");

function runEmptyMigrationRehearsal(dataDir) {
  const env = envFor(dataDir);
  execFileSync(process.execPath, ["scripts/migrate.mjs"], { cwd: root, env, stdio: "inherit" });
  execFileSync(process.execPath, ["scripts/migrate.mjs"], { cwd: root, env, stdio: "inherit" });

  const db = new Database(path.join(dataDir, "neta.db"));
  try {
    assert.equal(countRows(db, "instance_locales", "code in ('tr', 'en') and status = 'active'"), 2);
    assert.equal(single(db, "select default_locale from instance_i18n_settings where key = 'default'"), "tr");
    assert.equal(countRows(db, "content_translations"), 0);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  } finally {
    db.close();
  }
}

function runProductionLikeMigrationRehearsal(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const oldMigrationsDir = createPartialMigrationsDir(7);
  const dbPath = path.join(dataDir, "neta.db");
  const db = new Database(dbPath);
  try {
    applyPragmas(db);
    migrate(drizzle({ client: db }), { migrationsFolder: oldMigrationsDir });
    seedProductionLikeTurkishData(db);
  } finally {
    db.close();
  }

  const env = envFor(dataDir);
  execFileSync(process.execPath, ["scripts/migrate.mjs"], { cwd: root, env, stdio: "inherit" });
  assertBackfilledTurkishData(dbPath);
  const before = snapshotBackfillCounts(dbPath);
  execFileSync(process.execPath, ["scripts/migrate.mjs"], { cwd: root, env, stdio: "inherit" });
  assert.deepEqual(snapshotBackfillCounts(dbPath), before, "Backfill must be idempotent on repeated migrate");
}

function runBackupRestoreAndFailureRehearsal(sourceDataDir, targetRestoreDir, failedTargetDir) {
  const sourceDbPath = path.join(sourceDataDir, "neta.db");
  const db = new Database(sourceDbPath);
  try {
    db.prepare(`
      insert into instance_locales (code, name, native_name, status, fallback_locale, text_direction, built_in, sort_order)
      values ('fr', 'French', 'Français', 'active', 'en', 'ltr', 0, 30)
      on conflict(code) do update set status = excluded.status
    `).run();
    db.prepare(`
      insert into content_translations (entity_type, entity_id, field, locale, value)
      values ('project', 'prod-project', 'name', 'fr', 'Site de marque')
      on conflict(entity_type, entity_id, field, locale) do update set value = excluded.value
    `).run();
  } finally {
    db.close();
  }

  execFileSync(process.execPath, ["scripts/backup.mjs", "--retention-count", "2"], {
    cwd: root,
    env: envFor(sourceDataDir),
    stdio: "inherit",
  });
  const backupDir = latestBackupDir(path.join(sourceDataDir, "backups"));
  execFileSync(process.execPath, ["scripts/restore.mjs", "--from", backupDir, "--target", targetRestoreDir], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });

  const restored = new Database(path.join(targetRestoreDir, "neta.db"), { readonly: true });
  try {
    assert.equal(single(restored, "select status from instance_locales where code = 'fr'"), "active");
    assert.equal(
      single(restored, "select value from content_translations where entity_type = 'project' and entity_id = 'prod-project' and field = 'name' and locale = 'fr'"),
      "Site de marque",
    );
    assert.deepEqual(restored.pragma("foreign_key_check"), []);
  } finally {
    restored.close();
  }

  fs.mkdirSync(failedTargetDir, { recursive: true });
  fs.copyFileSync(path.join(targetRestoreDir, "neta.db"), path.join(failedTargetDir, "neta.db"));
  const tamperedBackup = path.join(workRoot, "tampered-backup");
  fs.cpSync(backupDir, tamperedBackup, { recursive: true });
  fs.appendFileSync(path.join(tamperedBackup, "neta.db"), "tamper");
  assert.throws(
    () => execFileSync(
      process.execPath,
      ["scripts/restore.mjs", "--from", tamperedBackup, "--target", failedTargetDir, "--force"],
      { cwd: root, env: process.env, stdio: "pipe" },
    ),
    /Command failed/,
  );
  const failedTarget = new Database(path.join(failedTargetDir, "neta.db"), { readonly: true });
  try {
    assert.equal(single(failedTarget, "select status from instance_locales where code = 'fr'"), "active");
  } finally {
    failedTarget.close();
  }
}

function assertSupabaseImportCoverage() {
  const importSmoke = fs.readFileSync(path.join(root, "scripts", "phase8-import-smoke.mjs"), "utf8");
  for (const marker of [
    "runImport([\"--dry-run\"])",
    "runImport([\"--allow-existing\"])",
    "invalid-enum",
    "invalid-foreign-key",
    "unsafe-storage",
    "rollback",
  ]) {
    assert.ok(importSmoke.includes(marker), `Supabase import smoke must cover ${marker}`);
  }
}

function assertStandaloneCatalogPresence() {
  const standaloneDir = path.join(root, ".next", "standalone");
  if (!fs.existsSync(standaloneDir)) return;
  const serverDir = path.join(standaloneDir, ".next", "server");
  const chunkText = listFiles(serverDir, ["."])
    .filter((file) => file.endsWith(".js"))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  for (const marker of [
    "auth.marketing.headline",
    "Türkçe",
    "English",
    "instance.localization",
  ]) {
    assert.ok(chunkText.includes(marker), `Standalone server bundle must include marker: ${marker}`);
  }
}

function createPartialMigrationsDir(maxIndex) {
  const source = path.join(root, "server", "db", "migrations");
  const destination = path.join(workRoot, `migrations-0-${maxIndex}`);
  fs.mkdirSync(path.join(destination, "meta"), { recursive: true });

  for (const entry of fs.readdirSync(source)) {
    const match = /^(\d{4})_.*\.sql$/.exec(entry);
    if (match && Number(match[1]) <= maxIndex) {
      fs.copyFileSync(path.join(source, entry), path.join(destination, entry));
    }
  }
  for (const entry of fs.readdirSync(path.join(source, "meta"))) {
    const match = /^(\d{4})_snapshot\.json$/.exec(entry);
    if (match && Number(match[1]) <= maxIndex) {
      fs.copyFileSync(path.join(source, "meta", entry), path.join(destination, "meta", entry));
    }
  }

  const journal = JSON.parse(fs.readFileSync(path.join(source, "meta", "_journal.json"), "utf8"));
  journal.entries = journal.entries.filter((entry) => entry.idx <= maxIndex);
  fs.writeFileSync(path.join(destination, "meta", "_journal.json"), `${JSON.stringify(journal, null, 2)}\n`);
  return destination;
}

function seedProductionLikeTurkishData(db) {
  const now = Date.now();
  db.prepare("insert into user (id, name, email, email_verified, created_at, updated_at) values (?, ?, ?, 1, ?, ?)")
    .run("prod-owner", "Prod Owner", "prod-owner@example.com", now, now);
  db.prepare("insert into app_profiles (auth_user_id, email, display_name, role, disabled, created_at, updated_at) values (?, ?, ?, 'freelancer', 0, ?, ?)")
    .run("prod-owner", "prod-owner@example.com", "Prod Owner", now, now);
  db.prepare("insert into user_preferences (owner_user_id, language, created_at, updated_at) values (?, 'tr', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    .run("prod-owner");
  db.prepare("insert into clients (id, owner_user_id, name, email, status, pipeline_stage, created_at, updated_at) values (?, ?, ?, ?, 'active', 'won', ?, ?)")
    .run("prod-client", "prod-owner", "Türkçe Müşteri", "client@example.com", now, now);
  db.prepare(`
    insert into projects (id, owner_user_id, client_id, name, description, status, currency, progress, progress_type, revision_quota, cover_image_alt, created_at, updated_at)
    values (?, ?, ?, ?, ?, 'active', 'TRY', 25, 'manual', 2, ?, ?, ?)
  `).run("prod-project", "prod-owner", "prod-client", "Marka Sitesi", "Türkçe proje açıklaması", "Kapak görseli", now, now);
  db.prepare(`
    insert into tasks (id, owner_user_id, client_id, project_id, title, description, status, priority, created_at, updated_at)
    values (?, ?, ?, ?, ?, ?, 'todo', 'medium', ?, ?)
  `).run("prod-task", "prod-owner", "prod-client", "prod-project", "Hero alanını hazırla", "Başlık ve CTA metnini düzenle", now, now);
  db.prepare(`
    insert into project_planning_sections (id, owner_user_id, project_id, category, title, content, metadata, sort_order, created_at, updated_at)
    values (?, ?, ?, 'overview', ?, ?, '{}', 1, ?, ?)
  `).run("prod-section", "prod-owner", "prod-project", "Genel Bakış", "Türkçe plan içeriği", now, now);
  db.prepare(`
    insert into instance_branding (id, owner_user_id, application_name, short_name, primary_color, accent_color, default_color_mode, radius_scale, organization_name, portal_welcome_text, portal_footer_text, updated_by_user_id, created_at, updated_at)
    values ('default', ?, 'Neta', 'Neta', '#C81E1E', '#E6EDF5', 'system', 'default', 'Prod Workspace', ?, ?, ?, ?, ?)
  `).run("prod-owner", "Portala hoş geldiniz", "Tüm hakları saklıdır", "prod-owner", now, now);
}

function assertBackfilledTurkishData(dbPath) {
  const db = new Database(dbPath);
  try {
    assert.equal(single(db, "select value from content_translations where entity_type = 'project' and entity_id = 'prod-project' and field = 'name' and locale = 'tr'"), "Marka Sitesi");
    assert.equal(single(db, "select value from content_translations where entity_type = 'project' and entity_id = 'prod-project' and field = 'description' and locale = 'tr'"), "Türkçe proje açıklaması");
    assert.equal(single(db, "select value from content_translations where entity_type = 'task' and entity_id = 'prod-task' and field = 'title' and locale = 'tr'"), "Hero alanını hazırla");
    assert.equal(single(db, "select value from content_translations where entity_type = 'planning_section' and entity_id = 'prod-section' and field = 'title' and locale = 'tr'"), "Genel Bakış");
    assert.equal(single(db, "select value from content_translations where entity_type = 'branding' and entity_id = 'default' and field = 'portalWelcome' and locale = 'tr'"), "Portala hoş geldiniz");
    assert.equal(single(db, "select default_locale from instance_i18n_settings where key = 'default'"), "tr");
    assert.equal(countRows(db, "instance_locales", "code in ('tr', 'en') and status = 'active'"), 2);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  } finally {
    db.close();
  }
}

function snapshotBackfillCounts(dbPath) {
  const db = new Database(dbPath);
  try {
    return {
      translations: countRows(db, "content_translations"),
      locales: countRows(db, "instance_locales"),
      settings: countRows(db, "instance_i18n_settings"),
    };
  } finally {
    db.close();
  }
}

function latestBackupDir(backupsDir) {
  return fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupsDir, entry.name))
    .sort((left, right) => path.basename(right).localeCompare(path.basename(left)))[0];
}

function envFor(dataDir) {
  return {
    ...process.env,
    DATA_DIR: dataDir,
    DATABASE_PATH: path.join(dataDir, "neta.db"),
  };
}

function countRows(db, table, where = "1 = 1") {
  return db.prepare(`select count(*) as value from ${table} where ${where}`).get().value;
}

function single(db, sql) {
  const row = db.prepare(sql).get();
  assert.ok(row, `Expected row for query: ${sql}`);
  return Object.values(row)[0];
}

function applyPragmas(db) {
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("busy_timeout = 5000");
}

function listFiles(baseDir, roots) {
  const files = [];
  for (const rootName of roots) {
    const start = path.join(baseDir, rootName);
    if (!fs.existsSync(start)) continue;
    walk(start, files);
  }
  return files;
}

function walk(current, files) {
  const stat = fs.lstatSync(current);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(current)) walk(path.join(current, entry), files);
    return;
  }
  if (stat.isFile()) files.push(current);
}
