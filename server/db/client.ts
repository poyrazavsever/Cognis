import "server-only";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { ensureDataDirectories, getServerConfig } from "@/server/config";
import * as schema from "@/server/db/schema";

export type SqliteConnection = {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
};

const globalForSqlite = globalThis as typeof globalThis & {
  __netaSqliteConnection?: SqliteConnection;
  __netaSqliteCloseHandlersRegistered?: boolean;
};

export function getSqliteConnection(): SqliteConnection {
  if (globalForSqlite.__netaSqliteConnection) {
    return globalForSqlite.__netaSqliteConnection;
  }

  const config = getServerConfig();
  ensureDataDirectories(config);

  const sqlite = new Database(config.databasePath);
  applyPragmas(sqlite);

  const connection = {
    sqlite,
    db: drizzle({ client: sqlite, schema }),
  };

  globalForSqlite.__netaSqliteConnection = connection;
  registerCloseHandlers();
  return connection;
}

export function closeSqliteConnection(): void {
  const connection = globalForSqlite.__netaSqliteConnection;

  if (!connection) {
    return;
  }

  connection.sqlite.close();
  globalForSqlite.__netaSqliteConnection = undefined;
}

export function applyPragmas(sqlite: Database.Database): void {
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("busy_timeout = 5000");
}

function registerCloseHandlers(): void {
  if (globalForSqlite.__netaSqliteCloseHandlersRegistered || process.env.NODE_ENV !== "production") {
    return;
  }

  process.once("beforeExit", closeSqliteConnection);
  globalForSqlite.__netaSqliteCloseHandlersRegistered = true;
}
