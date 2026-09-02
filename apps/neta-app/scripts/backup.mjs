import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { applySqlitePragmas, ensureDataLayout } from "./lib/data-dir.mjs";

const args = parseArgs(process.argv.slice(2));
const config = ensureDataLayout();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(config.backupsDir, `neta-${timestamp}`);
const uploadsBackupDir = path.join(backupDir, "uploads");
const databaseBackupPath = path.join(backupDir, "neta.db");

fs.mkdirSync(backupDir, { recursive: true });

const sqlite = new Database(config.databasePath);

try {
  applySqlitePragmas(sqlite);
  await sqlite.backup(databaseBackupPath);
} finally {
  sqlite.close();
}

copyDirectoryIfExists(config.uploadsDir, uploadsBackupDir);

const manifest = {
  format: "neta-backup",
  version: 1,
  createdAt: new Date().toISOString(),
  source: {
    dataDir: config.dataDir,
    databasePath: config.databasePath,
    uploadsDir: config.uploadsDir,
  },
  files: collectFiles(backupDir).map((filePath) => ({
    path: path.relative(backupDir, filePath).replace(/\\/g, "/"),
    bytes: fs.statSync(filePath).size,
    sha256: hashFile(filePath),
  })),
};

fs.writeFileSync(path.join(backupDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const removedBackups = applyRetention(config.backupsDir, backupDir, args.retentionCount);
console.log(`Backup created at ${backupDir}`);
if (args.retentionCount !== null) {
  console.log(
    `Retention kept the newest ${args.retentionCount} backup(s); removed ${removedBackups.length}.`,
  );
}

function parseArgs(values) {
  let retentionCount = parseOptionalPositiveInteger(
    process.env.BACKUP_RETENTION_COUNT,
    "BACKUP_RETENTION_COUNT",
  );

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--retention-count") {
      retentionCount = parseOptionalPositiveInteger(values[index + 1], "--retention-count");
      if (retentionCount === null) {
        throw new Error("--retention-count requires a positive integer.");
      }
      index += 1;
    } else {
      throw new Error(
        "Usage: node scripts/backup.mjs [--retention-count <positive-integer>]",
      );
    }
  }

  return { retentionCount };
}

function parseOptionalPositiveInteger(value, name) {
  if (value === undefined || value === null || value === "") return null;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return Number.parseInt(value, 10);
}

function copyDirectoryIfExists(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`Upload tree contains a symbolic link: ${sourcePath}`);
    } else if (entry.isDirectory()) {
      copyDirectoryIfExists(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    } else {
      throw new Error(`Upload tree contains an unsupported filesystem entry: ${sourcePath}`);
    }
  }
}

function collectFiles(rootDir) {
  const files = [];

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`Backup contains a symbolic link: ${entryPath}`);
    } else if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function applyRetention(backupsDir, currentBackupDir, retentionCount) {
  if (retentionCount === null) return [];

  const candidates = fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.isSymbolicLink() &&
        /^neta-\d{4}-\d{2}-\d{2}T/.test(entry.name) &&
        fs.existsSync(path.join(backupsDir, entry.name, "manifest.json")),
    )
    .map((entry) => path.join(backupsDir, entry.name))
    .sort((left, right) => path.basename(right).localeCompare(path.basename(left)));

  const currentIndex = candidates.indexOf(currentBackupDir);
  if (currentIndex > 0) {
    candidates.splice(currentIndex, 1);
    candidates.unshift(currentBackupDir);
  }

  const removed = candidates.slice(retentionCount);
  for (const candidate of removed) {
    fs.rmSync(candidate, { recursive: true, force: false });
  }
  return removed;
}
