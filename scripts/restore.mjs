import fs from "node:fs";
import path from "node:path";
import { ensureDataLayout, getDataConfig } from "./lib/data-dir.mjs";

const args = parseArgs(process.argv.slice(2));

if (!args.from) {
  throw new Error("Usage: node scripts/restore.mjs --from <backup-dir> [--target <data-dir>] [--force]");
}

const targetEnv = {
  ...process.env,
  DATA_DIR: args.target || process.env.DATA_DIR,
  DATABASE_PATH: undefined,
};

const config = ensureDataLayout(getDataConfig(targetEnv));
const backupDir = path.resolve(args.from);
const backupDbPath = path.join(backupDir, "neta.db");
const backupUploadsDir = path.join(backupDir, "uploads");

if (!fs.existsSync(backupDbPath)) {
  throw new Error(`Backup database not found: ${backupDbPath}`);
}

if (fs.existsSync(config.databasePath) && !args.force) {
  throw new Error(`Target database exists: ${config.databasePath}. Pass --force to overwrite.`);
}

fs.copyFileSync(backupDbPath, config.databasePath);

if (fs.existsSync(backupUploadsDir)) {
  fs.rmSync(config.uploadsDir, { recursive: true, force: true });
  copyDirectory(backupUploadsDir, config.uploadsDir);
}

console.log(`Backup restored from ${backupDir} to ${config.dataDir}`);

function parseArgs(values) {
  const parsed = { force: false };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === "--force") {
      parsed.force = true;
    } else if (value === "--from") {
      parsed.from = values[index + 1];
      index += 1;
    } else if (value === "--target") {
      parsed.target = values[index + 1];
      index += 1;
    }
  }

  return parsed;
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}
