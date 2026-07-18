import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import Database from "better-sqlite3";

const smokeRoot = path.join(process.cwd(), ".data", `phase1-smoke-${Date.now()}`);
const restoreRoot = `${smokeRoot}-restore`;
const env = { ...process.env, DATA_DIR: smokeRoot, DATABASE_PATH: "" };

fs.mkdirSync(smokeRoot, { recursive: true });

execFileSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

const dbPath = path.join(smokeRoot, "neta.db");
const sqlite = new Database(dbPath);

try {
  const before = sqlite.prepare("select value from runtime_checks where key = ?").get("last_migration");

  if (!before) {
    throw new Error("Migration smoke check failed: runtime_checks row missing.");
  }

  const now = Date.now();
  sqlite
    .prepare(
      `insert into runtime_checks (key, value, created_at, updated_at)
       values (?, ?, ?, ?)
       on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run("restart_probe", "persisted", now, now);
} finally {
  sqlite.close();
}

const uploadFixturePath = path.join(smokeRoot, "uploads", "project-assets", "backup-fixture.txt");
fs.mkdirSync(path.dirname(uploadFixturePath), { recursive: true });
fs.writeFileSync(uploadFixturePath, "neta-upload-backup-fixture");

const reopened = new Database(dbPath, { readonly: true });

try {
  const row = reopened.prepare("select value from runtime_checks where key = ?").get("restart_probe");

  if (!row || row.value !== "persisted") {
    throw new Error("Restart persistence smoke check failed.");
  }
} finally {
  reopened.close();
}

execFileSync(process.execPath, ["scripts/backup.mjs"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});
for (let index = 0; index < 2; index += 1) {
  execFileSync(
    process.execPath,
    ["scripts/backup.mjs", "--retention-count", "2"],
    { cwd: process.cwd(), env, stdio: "inherit" },
  );
}

const retainedBackups = fs
  .readdirSync(path.join(smokeRoot, "backups"))
  .filter((name) => name.startsWith("neta-"));
if (retainedBackups.length !== 2) {
  throw new Error(`Backup retention smoke check failed: expected 2, received ${retainedBackups.length}.`);
}

const backupDir = fs
  .readdirSync(path.join(smokeRoot, "backups"))
  .map((name) => path.join(smokeRoot, "backups", name))
  .sort()
  .at(-1);

if (!backupDir) {
  throw new Error("Backup smoke check failed: no backup directory produced.");
}

execFileSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, DATA_DIR: restoreRoot, DATABASE_PATH: "" },
  stdio: "inherit",
});
const staleUploadPath = path.join(restoreRoot, "uploads", "stale.txt");
fs.writeFileSync(staleUploadPath, "must-be-replaced");

execFileSync(process.execPath, ["scripts/restore.mjs", "--from", backupDir, "--target", restoreRoot, "--force"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

const restored = new Database(path.join(restoreRoot, "neta.db"), { readonly: true });

try {
  const row = restored.prepare("select value from runtime_checks where key = ?").get("restart_probe");

  if (!row || row.value !== "persisted") {
    throw new Error("Restore smoke check failed.");
  }
} finally {
  restored.close();
}

const restoredUploadFixture = path.join(
  restoreRoot,
  "uploads",
  "project-assets",
  "backup-fixture.txt",
);
if (fs.readFileSync(restoredUploadFixture, "utf8") !== "neta-upload-backup-fixture") {
  throw new Error("Restore smoke check failed: upload fixture missing or corrupted.");
}
if (fs.existsSync(staleUploadPath)) {
  throw new Error("Atomic restore smoke check failed: stale upload tree was not replaced.");
}

fs.appendFileSync(path.join(backupDir, "uploads", "project-assets", "backup-fixture.txt"), "-tampered");
let corruptedBackupRejected = false;
try {
  execFileSync(
    process.execPath,
    ["scripts/restore.mjs", "--from", backupDir, "--target", `${restoreRoot}-corrupt`, "--force"],
    { cwd: process.cwd(), env: process.env, stdio: "pipe" },
  );
} catch {
  corruptedBackupRejected = true;
}
if (!corruptedBackupRejected) {
  throw new Error("Restore smoke check failed: corrupted upload checksum was accepted.");
}

console.log("Phase 1 smoke checks passed.");
