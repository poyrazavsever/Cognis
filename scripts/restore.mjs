import crypto from "node:crypto";
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
const manifestPath = path.join(backupDir, "manifest.json");

if (!fs.existsSync(backupDbPath)) {
  throw new Error(`Backup database not found: ${backupDbPath}`);
}

verifyManifest(backupDir, manifestPath);

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

function verifyManifest(rootDir, manifestFile) {
  if (!fs.existsSync(manifestFile)) {
    throw new Error(`Backup manifest not found: ${manifestFile}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error("Backup manifest has no file entries.");
  }

  const normalizedRoot = path.resolve(rootDir);
  const verifiedPaths = new Set();
  for (const entry of manifest.files) {
    if (
      !entry ||
      typeof entry.path !== "string" ||
      typeof entry.bytes !== "number" ||
      typeof entry.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/i.test(entry.sha256)
    ) {
      throw new Error("Backup manifest contains an invalid file entry.");
    }
    const filePath = path.resolve(normalizedRoot, entry.path);
    if (!filePath.startsWith(`${normalizedRoot}${path.sep}`)) {
      throw new Error(`Backup manifest path escapes backup root: ${entry.path}`);
    }
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== entry.bytes) {
      throw new Error(`Backup file metadata mismatch: ${entry.path}`);
    }
    const actualHash = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(entry.sha256, "hex"))) {
      throw new Error(`Backup checksum mismatch: ${entry.path}`);
    }
    verifiedPaths.add(entry.path.replace(/\\/g, "/"));
  }

  const actualPaths = collectBackupFiles(normalizedRoot, normalizedRoot);
  if (
    actualPaths.length !== verifiedPaths.size ||
    actualPaths.some((filePath) => !verifiedPaths.has(filePath))
  ) {
    throw new Error("Backup contains files that are missing from the checksum manifest.");
  }
}

function collectBackupFiles(rootDir, currentDir) {
  const files = [];
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const entryPath = path.join(currentDir, entry.name);
    if (entryPath === path.join(rootDir, "manifest.json")) continue;
    if (entry.isSymbolicLink()) throw new Error(`Backup contains a symbolic link: ${entry.name}`);
    if (entry.isDirectory()) {
      files.push(...collectBackupFiles(rootDir, entryPath));
    } else if (entry.isFile()) {
      files.push(path.relative(rootDir, entryPath).replace(/\\/g, "/"));
    }
  }
  return files;
}
