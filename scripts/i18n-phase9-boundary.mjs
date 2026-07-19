import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

for (const scriptName of [
  "phase-i18n:boundary",
  "i18n:phase1-smoke",
  "i18n:phase2-smoke",
  "i18n:phase3-smoke",
  "i18n:phase4-boundary",
  "i18n:phase5-smoke",
  "i18n:phase7-smoke",
  "i18n:phase8-smoke",
  "i18n:phase9-hardening",
]) {
  assert.ok(pkg.scripts?.[scriptName], `Missing package script: ${scriptName}`);
}

const runtimeFiles = listFiles(root, [
  "app",
  "components",
  "config",
  "lib",
  "server",
]).filter((file) => /\.(ts|tsx|mjs|js)$/.test(file));
const boundaryAllowlist = new Set([
  path.join(root, "lib", "i18n", "date-fns.ts"),
  path.join(root, "lib", "i18n", "format.ts"),
]);

const forbiddenRuntimePatterns = [
  /@supabase\//i,
  /createClient\([^)]*supabase/i,
  /supabase\.co/i,
  /NEXT_PUBLIC_SUPABASE/i,
  /SUPABASE_SERVICE_ROLE/i,
  /from ["']date-fns\/locale\/tr["']/,
  /from ["']date-fns\/locale["']/,
  /["']tr-TR["']/,
];

const violations = [];
for (const file of runtimeFiles) {
  if (boundaryAllowlist.has(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of forbiddenRuntimePatterns) {
    if (pattern.test(text)) violations.push(`${path.relative(root, file)} :: ${pattern}`);
  }
}
assert.deepEqual(violations, [], `I18n release boundary violations:\n${violations.join("\n")}`);

const phase9ApiBoundary = fs.readFileSync(path.join(root, "scripts", "phase9-api-boundary.mjs"), "utf8");
for (const marker of [
  "instance.localization",
  "UNSUPPORTED_LOCALE",
  "Accept-Language",
  "resolvedLocale",
  "portalLocale",
]) {
  assert.ok(phase9ApiBoundary.includes(marker), `Phase 9 API boundary must include ${marker}`);
}

const hardcodedReport = path.join(root, "docs", "self-hosted-redesign", "i18n-phase-4-hardcoded-text-report.md");
assert.ok(fs.existsSync(hardcodedReport), "Hardcoded text report must exist for release review");
assert.ok(
  fs.readFileSync(hardcodedReport, "utf8").includes("release blocker"),
  "Hardcoded text report must document release blocker policy",
);

console.log("I18n phase 9 boundary passed: scripts, Supabase/runtime locale and release report gates verified.");

function listFiles(baseDir, roots) {
  const files = [];
  for (const rootName of roots) {
    const start = path.join(baseDir, rootName);
    if (!fs.existsSync(start)) continue;
    walk(start, files);
  }
  return files;
}

function walk(current, files) {
  const stat = fs.lstatSync(current);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    if (["node_modules", ".next", ".git"].includes(path.basename(current))) return;
    for (const entry of fs.readdirSync(current)) walk(path.join(current, entry), files);
    return;
  }
  if (stat.isFile()) files.push(current);
}
