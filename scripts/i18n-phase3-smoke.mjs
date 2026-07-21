import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".data", `i18n-phase3-smoke-${Date.now()}`);
const databasePath = path.join(dataDir, "neta.db");
const env = { ...process.env, DATA_DIR: dataDir, DATABASE_PATH: databasePath };

fs.mkdirSync(dataDir, { recursive: true });

execFileSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});
execFileSync("./node_modules/.bin/tsc", ["-p", "tsconfig.i18n-phase3-smoke.json"], {
  cwd: process.cwd(),
  stdio: "inherit",
});
const serverOnlyStubDir = path.join(process.cwd(), ".next", "i18n-phase3-smoke-dist", "node_modules", "server-only");
fs.mkdirSync(serverOnlyStubDir, { recursive: true });
fs.writeFileSync(path.join(serverOnlyStubDir, "index.js"), "\n");
execFileSync(
  process.execPath,
  [path.join(".next", "i18n-phase3-smoke-dist", "scripts", "i18n-phase3-smoke.js")],
  { cwd: process.cwd(), env, stdio: "inherit" },
);
