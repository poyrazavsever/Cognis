import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";

export type DomainDatabase = BetterSQLite3Database<typeof schema>;
