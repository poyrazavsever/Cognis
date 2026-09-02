import fs from "node:fs";
import path from "node:path";

export function getDataConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const dataDir = path.resolve(
    env.DATA_DIR && env.DATA_DIR.trim().length > 0
      ? env.DATA_DIR
      : nodeEnv === "production"
        ? "/app/data"
        : path.join(process.cwd(), ".data"),
  );

  const databasePath = path.resolve(
    env.DATABASE_PATH && env.DATABASE_PATH.trim().length > 0
      ? env.DATABASE_PATH
      : path.join(dataDir, "neta.db"),
  );

  return {
    dataDir,
    databasePath,
    uploadsDir: path.join(dataDir, "uploads"),
    backupsDir: path.join(dataDir, "backups"),
    tmpDir: path.join(dataDir, "tmp"),
    migrationsDir: path.join(process.cwd(), "server", "db", "migrations"),
  };
}

export function ensureDataLayout(config = getDataConfig()) {
  for (const dir of [config.dataDir, config.uploadsDir, config.backupsDir, config.tmpDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return config;
}

export function applySqlitePragmas(sqlite) {
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("busy_timeout = 5000");
}
