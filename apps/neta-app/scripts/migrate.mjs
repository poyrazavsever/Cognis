import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { pathToFileURL } from "node:url";
import { applySqlitePragmas, ensureDataLayout } from "./lib/data-dir.mjs";

export function runMigrations(databasePath) {
  const config = ensureDataLayout();
  const sqlite = new Database(databasePath ?? config.databasePath);

  try {
    applySqlitePragmas(sqlite);
    const db = drizzle({ client: sqlite });

    migrate(db, { migrationsFolder: config.migrationsDir });

    const now = Date.now();
    sqlite
      .prepare(
        `insert into runtime_checks (key, value, created_at, updated_at)
         values (@key, @value, @createdAt, @updatedAt)
         on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run({
        key: "last_migration",
        value: new Date(now).toISOString(),
        createdAt: now,
        updatedAt: now,
      });

    console.log(`Migrations applied to ${databasePath ?? config.databasePath}`);
  } finally {
    sqlite.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations();
}
