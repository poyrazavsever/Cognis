import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { applySqlitePragmas, ensureDataLayout } from "./lib/data-dir.mjs";

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

console.log(`Backup created at ${backupDir}`);

function copyDirectoryIfExists(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryIfExists(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function collectFiles(rootDir) {
  const files = [];

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
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
