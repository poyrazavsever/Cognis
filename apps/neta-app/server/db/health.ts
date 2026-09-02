import "server-only";

import fs from "node:fs";
import path from "node:path";
import { ensureDataDirectories, getServerConfig } from "@/server/config";
import { getSqliteConnection } from "@/server/db/client";

export type ReadinessStatus = {
  ok: boolean;
  checks: {
    dataDirWritable: boolean;
    databaseReachable: boolean;
    migrationsApplied: boolean;
  };
  error?: string;
};

export function checkReadiness(): ReadinessStatus {
  const config = getServerConfig();
  const checks = {
    dataDirWritable: false,
    databaseReachable: false,
    migrationsApplied: false,
  };

  try {
    ensureDataDirectories(config);
    assertWritableDirectory(config.dataDir);
    checks.dataDirWritable = true;

    const { sqlite } = getSqliteConnection();
    sqlite.prepare("select 1 as ok").get();
    checks.databaseReachable = true;

    const migrationRow = sqlite
      .prepare("select name from sqlite_master where type = 'table' and name = 'runtime_checks'")
      .get();
    checks.migrationsApplied = Boolean(migrationRow);

    return {
      ok: Boolean(migrationRow),
      checks,
      error: migrationRow ? undefined : "Migrations have not been applied.",
    };
  } catch (error) {
    return {
      ok: false,
      checks,
      error: error instanceof Error ? error.message : "Unknown readiness error.",
    };
  }
}

function assertWritableDirectory(dir: string): void {
  const probePath = path.join(dir, `.neta-write-${process.pid}-${Date.now()}`);

  fs.writeFileSync(probePath, "ok", { encoding: "utf8", flag: "wx" });
  fs.unlinkSync(probePath);
}
