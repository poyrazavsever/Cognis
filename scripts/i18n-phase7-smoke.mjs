import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const distDir = path.join(process.cwd(), ".next", "i18n-phase7-smoke-dist");

execFileSync("./node_modules/.bin/tsc", ["-p", "tsconfig.i18n-phase7-smoke.json"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

const serverOnlyStubDir = path.join(distDir, "node_modules", "server-only");
fs.mkdirSync(serverOnlyStubDir, { recursive: true });
fs.writeFileSync(path.join(serverOnlyStubDir, "index.js"), "\n");

execFileSync(process.execPath, [path.join(distDir, "scripts", "i18n-phase7-smoke.js")], {
  cwd: process.cwd(),
  stdio: "inherit",
});
