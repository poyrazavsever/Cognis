import Database from "better-sqlite3";
import { pathToFileURL } from "node:url";
import { applySqlitePragmas, ensureDataLayout } from "../lib/data-dir.mjs";

const registry = {
  branding: { table: "instance_branding", fields: ["portalWelcome", "portalFooter"] },
  calendar_event: { table: "calendar_events", fields: ["title", "description"] },
  chat_session: { table: "chat_sessions", fields: ["title"] },
  client: { table: "clients", fields: ["notes"] },
  client_activity: { table: "client_activities", fields: ["title", "content"] },
  finance_transaction: { table: "finance_transactions", fields: ["category", "description"] },
  journal_entry: { table: "journal_entries", fields: ["moodLabel", "note"] },
  planning_section: { table: "project_planning_sections", fields: ["title", "content"] },
  project: { table: "projects", fields: ["name", "description", "coverImageAlt"] },
  proposal: { table: "proposals", fields: ["title", "description"] },
  subscription: { table: "subscriptions", fields: ["name", "category"] },
  task: { table: "tasks", fields: ["title", "description"] },
};

export function runIntegrityCheck(argv = process.argv.slice(2)) {
  const fix = argv.includes("--fix");
  const failOnIssue = !argv.includes("--report-only");
  const config = ensureDataLayout();
  const sqlite = new Database(config.databasePath);

  try {
    applySqlitePragmas(sqlite);
    for (const table of ["instance_locales", "content_translations"]) {
      assertTable(sqlite, table);
    }

    const locales = sqlite.prepare("select code, status from instance_locales").all();
    const knownLocales = new Set(locales.map((locale) => locale.code));
    const activeLocales = new Set(locales.filter((locale) => locale.status === "active").map((locale) => locale.code));
    const issues = {
      invalidUserPreferences: tableExists(sqlite, "user_preferences")
        ? sqlite.prepare(`select owner_user_id as id, language as locale from user_preferences where language is not null and language not in (${placeholders([...activeLocales])})`).all([...activeLocales])
        : [],
      invalidClientPortalLocales: tableExists(sqlite, "clients")
        ? sqlite.prepare(`select id, portal_locale as locale from clients where portal_locale is not null and portal_locale not in (${placeholders([...activeLocales])})`).all([...activeLocales])
        : [],
      invalidInvitationLocales: tableExists(sqlite, "portal_invitations")
        ? sqlite.prepare(`select id, locale from portal_invitations where locale is not null and locale not in (${placeholders([...activeLocales])})`).all([...activeLocales])
        : [],
      unknownTranslationLocales: sqlite.prepare(`select id, entity_type as entityType, entity_id as entityId, field, locale from content_translations where locale not in (${placeholders([...knownLocales])})`).all([...knownLocales]),
      unsupportedTranslationFields: [],
      orphanTranslations: [],
    };

    const translations = sqlite
      .prepare("select id, entity_type as entityType, entity_id as entityId, field from content_translations")
      .all();
    for (const row of translations) {
      const definition = registry[row.entityType];
      if (!definition) {
        issues.orphanTranslations.push(row);
        continue;
      }
      if (!definition.fields.includes(row.field)) {
        issues.unsupportedTranslationFields.push(row);
        continue;
      }
      if (!tableExists(sqlite, definition.table)) {
        issues.orphanTranslations.push(row);
        continue;
      }
      const exists = sqlite.prepare(`select 1 from "${definition.table}" where id = ? limit 1`).get(row.entityId);
      if (!exists) issues.orphanTranslations.push(row);
    }

    let fixed = 0;
    if (fix) {
      const remove = sqlite.prepare("delete from content_translations where id = ?");
      const ids = uniqueIds([...issues.orphanTranslations, ...issues.unsupportedTranslationFields]);
      const transaction = sqlite.transaction(() => {
        for (const id of ids) fixed += remove.run(id).changes;
      });
      transaction();
    }

    const counts = Object.fromEntries(
      Object.entries(issues).map(([key, rows]) => [key, rows.length]),
    );
    const totalIssues = Object.values(counts).reduce((total, count) => total + count, 0);
    const summary = {
      ok: fix ? totalIssues === fixed : totalIssues === 0,
      databasePath: config.databasePath,
      fix,
      fixed,
      counts,
      samples: Object.fromEntries(Object.entries(issues).map(([key, rows]) => [key, rows.slice(0, 10)])),
    };

    console.log(JSON.stringify(summary, null, 2));
    if (failOnIssue && totalIssues > 0 && !fix) process.exitCode = 1;
    return summary;
  } finally {
    sqlite.close();
  }
}

function placeholders(values) {
  return values.length ? values.map(() => "?").join(",") : "''";
}

function uniqueIds(rows) {
  return [...new Set(rows.map((row) => row.id))];
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
  runIntegrityCheck();
}
