import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const files = walk("app/portal").filter((file) => /\.(ts|tsx)$/.test(file));
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
  `Phase 6 portal boundary violations:\n${violations.join("\n")}`,
);

for (const file of [
  "app/portal/layout.tsx",
  "app/portal/page.tsx",
  "app/portal/projects/page.tsx",
  "app/portal/projects/[id]/page.tsx",
  "app/portal/projects/[id]/actions.ts",
  "app/portal/tasks/page.tsx",
  "app/portal/revisions/page.tsx",
]) {
  const content = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  assert.match(content, /requirePortalBackend/, `${file} must derive its actor from the portal session adapter`);
}

assert.ok(fs.existsSync(path.join(process.cwd(), "server/web/portal.ts")), "Missing portal session adapter");
console.log(`Phase 6 portal boundary passed (${files.length} files scanned).`);

function walk(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);
  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relativePath, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}
