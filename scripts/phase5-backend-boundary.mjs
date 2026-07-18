import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const roots = [
  "app/(dashboard)/settings",
  "app/(dashboard)/clients",
  "app/(dashboard)/projects",
  "app/(dashboard)/tasks",
  "app/(dashboard)/calendar",
  "app/(dashboard)/finance",
  "app/(dashboard)/journal",
];
const files = [
  ...roots.flatMap(walk),
  "app/(dashboard)/page.tsx",
  "app/(dashboard)/analytics/page.tsx",
].filter((file) => /\.(ts|tsx)$/.test(file));

const violations = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  if (/[@/]lib\/supabase|createServiceRoleClient|\bsupabase\b/i.test(content)) {
    violations.push(`${file}: Supabase runtime reference`);
  }
  if (/NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE/.test(content)) {
    violations.push(`${file}: Supabase environment dependency`);
  }
}

assert.deepEqual(
  violations,
  [],
  `Phase 5 freelancer backend boundary violations:\n${violations.join("\n")}`,
);

for (const required of [
  "server/web/freelancer.ts",
  "server/services/analytics-range.ts",
  "server/settings/ai.ts",
  "server/db/migrations/0005_brief_black_bolt.sql",
]) {
  assert.ok(fs.existsSync(path.join(process.cwd(), required)), `Missing Phase 5 backend artifact: ${required}`);
}

console.log(`Phase 5 backend boundary passed (${files.length} files scanned).`);

function walk(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) return [relativePath];
  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relativePath, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}
