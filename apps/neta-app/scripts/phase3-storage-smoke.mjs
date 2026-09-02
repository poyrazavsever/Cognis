import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".data", `phase3-storage-smoke-${Date.now()}`);
const databasePath = path.join(dataDir, "neta.db");
const env = { ...process.env, DATA_DIR: dataDir, DATABASE_PATH: databasePath };

fs.mkdirSync(dataDir, { recursive: true });
execFileSync(process.execPath, ["scripts/migrate.mjs"], { cwd: process.cwd(), env, stdio: "inherit" });
execFileSync("./node_modules/.bin/tsc", ["-p", "tsconfig.phase3-smoke.json"], {
  cwd: process.cwd(),
  stdio: "inherit",
});
execFileSync(
  process.execPath,
  [path.join(".next", "phase3-storage-smoke-dist", "scripts", "phase3-storage-smoke.js"), dataDir],
  { cwd: process.cwd(), stdio: "inherit" },
);
