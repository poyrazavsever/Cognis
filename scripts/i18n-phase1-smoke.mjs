import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDir = path.join(process.cwd(), ".data", `i18n-phase1-smoke-${Date.now()}`);
const databasePath = path.join(dataDir, "neta.db");
const restoreDir = `${dataDir}-restore`;
const env = { ...process.env, DATA_DIR: dataDir, DATABASE_PATH: databasePath };

fs.mkdirSync(dataDir, { recursive: true });

execFileSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

assertMigratedDatabase(databasePath, "tr");

execFileSync("./node_modules/.bin/tsc", ["-p", "tsconfig.i18n-phase1-smoke.json"], {
  cwd: process.cwd(),
  stdio: "inherit",
});
execFileSync(
  process.execPath,
  [path.join(".next", "i18n-phase1-smoke-dist", "scripts", "i18n-phase1-smoke.js"), databasePath],
  { cwd: process.cwd(), stdio: "inherit" },
);

execFileSync(process.execPath, ["scripts/backup.mjs", "--retention-count", "1"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

const backupDir = latestBackupDir(path.join(dataDir, "backups"));
execFileSync(
  process.execPath,
  ["scripts/restore.mjs", "--from", backupDir, "--target", restoreDir],
  { cwd: process.cwd(), env: process.env, stdio: "inherit" },
);

assertMigratedDatabase(path.join(restoreDir, "neta.db"), "fr");
assertRestoredI18nData(path.join(restoreDir, "neta.db"));

console.log("I18n phase 1 migration, service and backup/restore smoke passed.");

function assertMigratedDatabase(dbPath, expectedDefaultLocale) {
  const sqlite = new Database(dbPath);
  try {
    for (const tableName of [
      "instance_locales",
      "instance_i18n_settings",
      "instance_ui_translations",
      "content_translations",
    ]) {
      assert.equal(
        sqlite.prepare("select count(*) as value from sqlite_master where type = 'table' and name = ?").get(tableName).value,
        1,
        `${tableName} must exist`,
      );
    }

    const builtInLocales = sqlite
      .prepare("select code, status, fallback_locale as fallbackLocale, built_in as builtIn from instance_locales where code in ('tr', 'en') order by sort_order")
      .all();
    assert.deepEqual(
      builtInLocales,
      [
        { code: "tr", status: "active", fallbackLocale: null, builtIn: 1 },
        { code: "en", status: "active", fallbackLocale: "tr", builtIn: 1 },
      ],
      "Built-in locales must be seeded",
    );
    assert.deepEqual(
      sqlite.prepare("select key, default_locale as defaultLocale, catalog_version as catalogVersion from instance_i18n_settings").all(),
      [{ key: "default", defaultLocale: expectedDefaultLocale, catalogVersion: 1 }],
      "Default i18n settings must be seeded",
    );

    const clientColumns = sqlite.prepare("pragma table_info(clients)").all().map((column) => column.name);
    assert.equal(clientColumns.includes("portal_locale"), true, "clients.portal_locale must exist");
    const invitationColumns = sqlite.prepare("pragma table_info(portal_invitations)").all().map((column) => column.name);
    assert.equal(invitationColumns.includes("locale"), true, "portal_invitations.locale must exist");

    sqlite.prepare(
      "insert into user (id, name, email, email_verified, created_at, updated_at) values (?, ?, ?, ?, ?, ?)",
    ).run("locale-preference-user", "Locale Preference User", "locale-preference@example.com", 1, Date.now(), Date.now());
    sqlite.prepare("insert into user_preferences (owner_user_id, language) values (?, ?)").run("locale-preference-user", "fr");
    sqlite.prepare("delete from user_preferences where owner_user_id = ?").run("locale-preference-user");
    sqlite.prepare("delete from user where id = ?").run("locale-preference-user");
  } finally {
    sqlite.close();
  }
}

function assertRestoredI18nData(dbPath) {
  const sqlite = new Database(dbPath);
  try {
    assert.equal(
      sqlite.prepare("select default_locale as value from instance_i18n_settings where key = 'default'").get().value,
      "fr",
      "Restored backup must include updated i18n settings",
    );
    assert.equal(
      sqlite.prepare("select value from content_translations where locale = 'fr' and entity_id = 'i18n-project'").get().value,
      "Projet multilingue",
      "Restored backup must include content translations",
    );
  } finally {
    sqlite.close();
  }
}

function latestBackupDir(backupsDir) {
  const entries = fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupsDir, entry.name))
    .sort((left, right) => path.basename(right).localeCompare(path.basename(left)));
  assert.ok(entries[0], "Backup directory must contain a backup");
  return entries[0];
}
