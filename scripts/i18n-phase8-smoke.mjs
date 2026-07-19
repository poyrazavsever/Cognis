import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const distDir = path.join(process.cwd(), ".next", "i18n-phase8-smoke-dist");

execFileSync(process.execPath, ["scripts/phase9-api-boundary.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

execFileSync("./node_modules/.bin/tsc", ["-p", "tsconfig.i18n-phase8-smoke.json"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

const serverOnlyStubDir = path.join(distDir, "node_modules", "server-only");
fs.mkdirSync(serverOnlyStubDir, { recursive: true });
fs.writeFileSync(path.join(serverOnlyStubDir, "index.js"), "\n");

const aliasScopeDir = path.join(distDir, "node_modules", "@");
fs.mkdirSync(aliasScopeDir, { recursive: true });
const serverAlias = path.join(aliasScopeDir, "server");
if (!fs.existsSync(serverAlias)) {
  fs.symlinkSync(path.join(distDir, "server"), serverAlias, "dir");
}

execFileSync(process.execPath, [path.join(distDir, "scripts", "i18n-phase8-smoke.js")], {
  cwd: process.cwd(),
  stdio: "inherit",
});
