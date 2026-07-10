import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { ensureDataLayout } from "./lib/data-dir.mjs";
import { runMigrations } from "./migrate.mjs";

const requiredTables = [
  "user",
  "session",
  "account",
  "verification",
  "app_profiles",
  "app_setup_state",
  "portal_invitations",
  "auth_audit_events",
];

const requiredIndexes = [
  "app_profiles_auth_user_id_unique",
  "portal_invitations_token_hash_unique",
  "session_user_id_idx",
  "account_user_id_idx",
];

async function main() {
  const paths = ensureDataLayout();

  runMigrations(paths.databasePath);

  const sqlite = new Database(paths.databasePath, { readonly: true });

  try {
    const tables = sqlite
      .prepare("select name from sqlite_master where type = 'table'")
      .all()
      .map((row) => row.name);

    const indexes = sqlite
      .prepare("select name from sqlite_master where type = 'index'")
      .all()
      .map((row) => row.name);

    for (const table of requiredTables) {
      assert.ok(tables.includes(table), `Missing auth table: ${table}`);
    }

    for (const index of requiredIndexes) {
      assert.ok(indexes.includes(index), `Missing auth index: ${index}`);
    }

    const profileColumns = sqlite.prepare("pragma table_info(app_profiles)").all();
    const roleColumn = profileColumns.find((column) => column.name === "role");
    const disabledColumn = profileColumns.find((column) => column.name === "disabled");

    assert.equal(roleColumn?.notnull, 1, "app_profiles.role must be required");
    assert.equal(disabledColumn?.notnull, 1, "app_profiles.disabled must be required");

    console.log("Phase 2 auth smoke passed");
  } finally {
    sqlite.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
