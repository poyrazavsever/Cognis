import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const runtimeChecks = sqliteTable("runtime_checks", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const runtimeEvents = sqliteTable("runtime_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
