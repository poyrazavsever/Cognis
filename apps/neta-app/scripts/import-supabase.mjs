import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { applySqlitePragmas, ensureDataLayout, getDataConfig } from "./lib/data-dir.mjs";
import {
  applySupabaseImport,
  assertTargetImportSafety,
  loadImportBundle,
  prepareSupabaseImport,
  rollbackStagedFiles,
  stageImportFiles,
  validateTargetOwner,
} from "./lib/supabase-import.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.from || !args.ownerUserId) {
  throw new Error(
    "Usage: node scripts/import-supabase.mjs --from <export-dir> --owner-user-id <better-auth-user-id> [--dry-run] [--allow-existing] [--report <path>]",
  );
}

const config = ensureDataLayout(getDataConfig(process.env));
const { bundle, bundleDir, bundlePath } = loadImportBundle(args.from);
const plan = prepareSupabaseImport({
  bundle,
  bundleDir,
  targetOwnerUserId: args.ownerUserId,
});
const db = new Database(config.databasePath);
let stagedFiles = [];

try {
  applySqlitePragmas(db);
  const owner = validateTargetOwner(db, args.ownerUserId);
  const existingCounts = assertTargetImportSafety(db, plan, args.allowExisting || args.dryRun);
  const report = {
    format: "neta-supabase-import-report",
    version: 1,
    mode: args.dryRun ? "dry-run" : "apply",
    exportPath: bundlePath,
    sourceOwnerUserId: plan.sourceOwnerUserId,
    targetOwnerUserId: plan.targetOwnerUserId,
    targetOwnerEmail: owner.email,
    sourceCounts: plan.sourceCounts,
    targetCounts: plan.targetCounts,
    existingCounts,
    warnings: plan.warnings,
    verification: null,
    completedAt: null,
  };

  if (!args.dryRun) {
    stagedFiles = stageImportFiles(plan, config.uploadsDir);
    try {
      report.verification = applySupabaseImport(db, plan);
      report.completedAt = new Date().toISOString();
    } catch (error) {
      rollbackStagedFiles(stagedFiles);
      throw error;
    }
  }

  const reportPath = path.resolve(
    args.report ?? path.join(config.dataDir, args.dryRun ? "import-dry-run-report.json" : "import-report.json"),
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`${args.dryRun ? "Import dry-run" : "Import"} completed. Report: ${reportPath}`);
  for (const warning of report.warnings) console.warn(`Warning: ${warning}`);
} finally {
  db.close();
}

function parseArgs(values) {
  const parsed = { dryRun: false, allowExisting: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--dry-run") parsed.dryRun = true;
    else if (value === "--allow-existing") parsed.allowExisting = true;
    else if (value === "--from") parsed.from = values[++index];
    else if (value === "--owner-user-id") parsed.ownerUserId = values[++index];
    else if (value === "--report") parsed.report = values[++index];
    else throw new Error(`Unknown argument: ${value}`);
  }
  return parsed;
}
