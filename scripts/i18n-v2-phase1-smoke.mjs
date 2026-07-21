import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputRoot = path.join(root, ".next", "i18n-v2-phase1-smoke-dist");

execFileSync("./node_modules/.bin/tsc", ["-p", "tsconfig.i18n-v2-phase1-smoke.json"], {
  cwd: root,
  stdio: "inherit",
});

const packageFile = path.join(outputRoot, "package.json");
fs.writeFileSync(packageFile, '{"type":"commonjs"}\n');

execFileSync(
  process.execPath,
  [path.join(outputRoot, "scripts", "i18n-v2-phase1-smoke.js")],
  { cwd: root, stdio: "inherit" },
);
