import { sql } from "drizzle-orm";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
