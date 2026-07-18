import { defineConfig } from "drizzle-kit";
import path from "node:path";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), ".data");

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(dataDir, "neta.db");

export default defineConfig({
  dialect: "sqlite",
  schema: "./server/db/schema/index.ts",
  out: "./server/db/migrations",
  dbCredentials: {
    url: databasePath,
  },
  strict: true,
});
