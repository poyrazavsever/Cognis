import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export type LocaleStatus = "draft" | "active" | "archived" | "test";
export type TextDirection = "ltr" | "rtl";
export type TranslationEntityType =
  | "branding"
  | "calendar_event"
  | "chat_session"
  | "client"
  | "client_activity"
  | "finance_transaction"
  | "journal_entry"
  | "planning_section"
  | "proposal"
  | "project"
  | "subscription"
  | "task";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const instanceLocales = sqliteTable(
  "instance_locales",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    nativeName: text("native_name").notNull(),
    status: text("status").$type<LocaleStatus>().default("draft").notNull(),
    fallbackLocale: text("fallback_locale"),
    textDirection: text("text_direction").$type<TextDirection>().default("ltr").notNull(),
    builtIn: integer("built_in", { mode: "boolean" }).default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("instance_locales_status_idx").on(table.status),
    index("instance_locales_fallback_idx").on(table.fallbackLocale),
    check(
      "instance_locales_code_check",
      sql`${table.code} glob '[a-z][a-z]' or ${table.code} glob '[a-z][a-z]-[A-Z][A-Z]' or ${table.code} glob '[a-z][a-z]-[A-Z][A-Z][0-9]'`,
    ),
    check("instance_locales_status_check", sql`${table.status} in ('draft', 'active', 'archived', 'test')`),
    check("instance_locales_direction_check", sql`${table.textDirection} in ('ltr', 'rtl')`),
    check("instance_locales_not_self_fallback_check", sql`${table.fallbackLocale} is null or ${table.fallbackLocale} != ${table.code}`),
  ],
);

export const instanceI18nSettings = sqliteTable("instance_i18n_settings", {
  key: text("key").primaryKey().default("default").notNull(),
  defaultLocale: text("default_locale").default("tr").notNull(),
  catalogVersion: integer("catalog_version").default(1).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const instanceUiTranslations = sqliteTable(
  "instance_ui_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    locale: text("locale").notNull(),
    namespace: text("namespace").notNull(),
    translationKey: text("translation_key").notNull(),
    value: text("value").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("instance_ui_translations_locale_key_unique").on(
      table.locale,
      table.namespace,
      table.translationKey,
    ),
    index("instance_ui_translations_locale_namespace_idx").on(table.locale, table.namespace),
    check("instance_ui_translations_locale_check", sql`length(${table.locale}) between 2 and 12`),
    check("instance_ui_translations_namespace_check", sql`length(${table.namespace}) between 1 and 64`),
    check("instance_ui_translations_key_check", sql`length(${table.translationKey}) between 1 and 160`),
  ],
);

export const contentTranslations = sqliteTable(
  "content_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type").$type<TranslationEntityType>().notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field").notNull(),
    locale: text("locale").notNull(),
    value: text("value").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("content_translations_entity_field_locale_unique").on(
      table.entityType,
      table.entityId,
      table.field,
      table.locale,
    ),
    index("content_translations_locale_idx").on(table.locale),
    index("content_translations_entity_locale_idx").on(table.entityType, table.entityId, table.locale),
    check(
      "content_translations_entity_type_check",
      sql`${table.entityType} in ('branding', 'calendar_event', 'chat_session', 'client', 'client_activity', 'finance_transaction', 'journal_entry', 'planning_section', 'proposal', 'project', 'subscription', 'task')`,
    ),
    check("content_translations_field_check", sql`length(${table.field}) between 1 and 64`),
    check("content_translations_locale_check", sql`length(${table.locale}) between 2 and 12`),
  ],
);
