import Database from "better-sqlite3";
import { pathToFileURL } from "node:url";
import { applySqlitePragmas, ensureDataLayout } from "../lib/data-dir.mjs";

const registry = [
  { entityType: "project", table: "projects", fields: { name: "name", description: "description", coverImageAlt: "cover_image_alt" } },
  { entityType: "planning_section", table: "project_planning_sections", fields: { title: "title", content: "content" } },
  { entityType: "task", table: "tasks", fields: { title: "title", description: "description" } },
  { entityType: "branding", table: "instance_branding", fields: { portalWelcome: "portal_welcome_text", portalFooter: "portal_footer_text" } },
  { entityType: "calendar_event", table: "calendar_events", fields: { title: "title", description: "description" } },
  { entityType: "client", table: "clients", fields: { notes: "notes" } },
  { entityType: "client_activity", table: "client_activities", fields: { title: "title", content: "content" } },
  { entityType: "finance_transaction", table: "finance_transactions", fields: { category: "category", description: "description" } },
  { entityType: "journal_entry", table: "journal_entries", fields: { moodLabel: "mood_label", note: "note" } },
  { entityType: "chat_session", table: "chat_sessions", fields: { title: "title" } },
  { entityType: "proposal", table: "proposals", fields: { title: "title", description: "description" } },
  { entityType: "subscription", table: "subscriptions", fields: { name: "name", category: "category" } },
];

export function runBackfill(argv = process.argv.slice(2)) {
  const write = argv.includes("--write");
  const startedAt = Date.now();
  const config = ensureDataLayout();
  const sqlite = new Database(config.databasePath);

  try {
    applySqlitePragmas(sqlite);
    assertTable(sqlite, "content_translations");
    const defaultLocale = getDefaultLocale(sqlite);
    const insert = sqlite.prepare(`
      insert into content_translations (entity_type, entity_id, field, locale, value, created_at, updated_at)
      values (@entityType, @entityId, @field, @locale, @value, @now, @now)
      on conflict(entity_type, entity_id, field, locale) do nothing
    `);
    const existing = sqlite.prepare(`
      select 1
      from content_translations
      where entity_type = ? and entity_id = ? and field = ? and locale = ?
      limit 1
    `);
    const summary = {
      dryRun: !write,
      databasePath: config.databasePath,
      defaultLocale,
      planned: 0,
      inserted: 0,
      skippedTables: [],
      byEntity: {},
      durationMs: 0,
    };

    const apply = sqlite.transaction(() => {
      for (const item of registry) {
        if (!tableExists(sqlite, item.table)) {
          summary.skippedTables.push(item.table);
          continue;
        }
        const columns = Object.values(item.fields);
        const rows = sqlite
          .prepare(`select id, ${columns.map((column) => `"${column}"`).join(", ")} from "${item.table}"`)
          .all();

        for (const row of rows) {
          for (const [field, column] of Object.entries(item.fields)) {
            const value = normalizeText(row[column]);
            if (!value) continue;
            if (existing.get(item.entityType, String(row.id), field, defaultLocale)) continue;

            summary.planned += 1;
            summary.byEntity[item.entityType] = (summary.byEntity[item.entityType] ?? 0) + 1;
            if (write) {
              const result = insert.run({
                entityType: item.entityType,
                entityId: String(row.id),
                field,
                locale: defaultLocale,
                value,
                now: Date.now(),
              });
              summary.inserted += result.changes;
            }
          }
        }
      }
    });

    apply();
    summary.durationMs = Date.now() - startedAt;
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    sqlite.close();
  }
}

function getDefaultLocale(sqlite) {
  if (!tableExists(sqlite, "instance_i18n_settings")) return "tr";
  return sqlite
    .prepare("select default_locale from instance_i18n_settings where key = 'default'")
    .get()
    ?.default_locale ?? "tr";
}

function normalizeText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function assertTable(sqlite, table) {
  if (!tableExists(sqlite, table)) {
    throw new Error(`${table} tablosu bulunamadı. Önce pnpm db:migrate çalıştır.`);
  }
}

function tableExists(sqlite, table) {
  return Boolean(sqlite.prepare("select 1 from sqlite_master where type = 'table' and name = ?").get(table));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runBackfill();
}
