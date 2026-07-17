import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const runtimeRoots = [
  "app/(dashboard)/chat",
  "app/(dashboard)/business",
  "app/api/chat",
  "app/api/finance-analysis",
  "app/api/project-risk",
];
const files = runtimeRoots
  .flatMap(walk)
  .filter((file) => /\.(ts|tsx)$/.test(file));
const violations = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  if (/[@/]lib\/supabase|createServiceRoleClient|\bsupabase\b/i.test(content)) {
    violations.push(`${file}: Supabase runtime reference`);
  }
  if (/NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE/.test(content)) {
    violations.push(`${file}: Supabase environment dependency`);
  }
  if (/\blocalStorage\b/.test(content)) {
    violations.push(`${file}: browser localStorage dependency`);
  }
}

for (const route of [
  "app/api/chat/route.ts",
  "app/api/finance-analysis/route.ts",
  "app/api/project-risk/route.ts",
]) {
  const content = fs.readFileSync(path.join(process.cwd(), route), "utf8");
  if (/body\.(apiKey|provider)|create(OpenAI|Groq|GoogleGenerativeAI)/.test(content)) {
    violations.push(`${route}: provider or secret is selected from the route/browser boundary`);
  }
}

const chatPage = fs.readFileSync(
  path.join(process.cwd(), "app/(dashboard)/chat/page.tsx"),
  "utf8",
);
if (/\bapiKey\b|\bprovider\b/.test(chatPage)) {
  violations.push("app/(dashboard)/chat/page.tsx: AI secret/provider leaked to browser code");
}

const chatRoute = fs.readFileSync(
  path.join(process.cwd(), "app/api/chat/route.ts"),
  "utf8",
);
for (const transportField of ['id:', 'trigger:', 'messageId:']) {
  assert.ok(
    chatRoute.includes(transportField),
    `Chat request schema must accept AI SDK v6 transport field ${transportField}`,
  );
}
for (const diagnosticMarker of [
  "describeRequestIssues",
  "x-neta-error-code",
  "geçerli bir JSON gövdesi",
  "her mesaj id, role ve parts",
]) {
  assert.ok(
    chatRoute.includes(diagnosticMarker),
    `Chat route is missing diagnostic marker: ${diagnosticMarker}`,
  );
}

const aiProvider = fs.readFileSync(
  path.join(process.cwd(), "server/ai/provider.ts"),
  "utf8",
);
for (const providerDiagnostic of [
  "APICallError",
  "API anahtarını reddetti",
  "kullanım limiti aşıldı",
  "modeli sağlayıcıda bulunamadı",
]) {
  assert.ok(
    aiProvider.includes(providerDiagnostic),
    `AI provider diagnostics are missing: ${providerDiagnostic}`,
  );
}

assert.deepEqual(
  violations,
  [],
  `Phase 7 backend boundary violations:\n${violations.join("\n")}`,
);

for (const required of [
  "server/ai/context.ts",
  "server/ai/provider.ts",
  "server/ai/responses.ts",
  "app/(dashboard)/chat/actions.ts",
  "scripts/phase7-domain-smoke.ts",
]) {
  assert.ok(fs.existsSync(path.join(process.cwd(), required)), `Missing Phase 7 artifact: ${required}`);
}

const allRuntimeSources = [
  ...walk("app"),
  ...walk("server"),
].filter((file) => /\.(ts|tsx)$/.test(file));
for (const file of allRuntimeSources) {
  const content = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(
    content,
    /from\s+["'][^"']*lib\/ai\/embeddings["']/,
    `Legacy Supabase embeddings helper is imported at runtime by ${file}`,
  );
}

console.log(`Phase 7 backend boundary passed (${files.length} files scanned).`);

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
