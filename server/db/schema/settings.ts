import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export type AiProvider = "gemini" | "openai" | "groq" | "ollama";

export const userAiSettings = sqliteTable(
  "user_ai_settings",
  {
    ownerUserId: text("owner_user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").$type<AiProvider>().default("gemini").notNull(),
    model: text("model"),
    encryptedApiKey: text("encrypted_api_key"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    check(
      "user_ai_settings_provider_check",
      sql`${table.provider} in ('gemini', 'openai', 'groq', 'ollama')`,
    ),
  ],
);

export const userPreferences = sqliteTable(
  "user_preferences",
  {
    ownerUserId: text("owner_user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    timezone: text("timezone").default("Europe/Istanbul").notNull(),
    defaultCurrency: text("default_currency").default("TRY").notNull(),
    language: text("language").default("tr").notNull(),
    dateFormat: text("date_format").default("dd.MM.yyyy").notNull(),
    colorMode: text("color_mode").default("system").notNull(),
    sidebarCollapsed: integer("sidebar_collapsed", { mode: "boolean" }).default(false).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    check("user_preferences_currency_check", sql`length(${table.defaultCurrency}) = 3`),
    check("user_preferences_language_check", sql`${table.language} in ('tr', 'en')`),
    check("user_preferences_color_mode_check", sql`${table.colorMode} in ('light', 'dark', 'system')`),
  ],
);
