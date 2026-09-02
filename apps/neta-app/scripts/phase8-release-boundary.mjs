import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const repoRoot = path.resolve(appRoot, "../..");
const packageJson = readJson("package.json");
const rootPackageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const installed = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
  ...packageJson.optionalDependencies,
};

assert.equal(rootPackageJson.packageManager, "pnpm@11.5.1", "The canonical package manager must be pinned");
assert.equal(
  fs.existsSync(path.join(repoRoot, "package-lock.json")),
  false,
  "A second npm lockfile must not diverge from the canonical pnpm lockfile",
);

const removedPackages = [
  "@supabase/ssr",
  "@supabase/supabase-js",
  "@ducanh2912/next-pwa",
  "dexie",
  "dexie-react-hooks",
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
  "@hookform/resolvers",
  "uuid",
  "@types/uuid",
];
for (const dependency of removedPackages) {
  assert.equal(installed[dependency], undefined, `Removed dependency is still declared: ${dependency}`);
}

assert.equal(
  packageJson.scripts?.start,
  "node .next/standalone/apps/neta-app/server.js",
  "Production start command must use the generated standalone server",
);
assert.equal(
  packageJson.scripts?.postbuild,
  "node scripts/prepare-standalone.mjs",
  "Production build must package public and static assets into standalone output",
);
const dockerfile = fs.readFileSync(path.join(repoRoot, "Dockerfile"), "utf8");
assert.match(dockerfile, /COPY package\.json pnpm-lock\.yaml pnpm-workspace\.yaml \.\//);
assert.match(dockerfile, /pnpm install --frozen-lockfile --config\.node-linker=hoisted --filter @neta\/app\.\.\./);
assert.match(dockerfile, /pnpm --filter @neta\/app build/);
assert.doesNotMatch(dockerfile, /\bnpm (?:ci|install|run)\b/);

const runtimeTargets = [
  "app",
  "components",
  "config",
  "lib",
  "server",
  "proxy.ts",
  "next.config.ts",
  ".env.example",
];
const runtimePatterns = [
  [/@supabase\//i, "Supabase package import"],
  [/\b(?:NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)\b/, "Supabase runtime environment variable"],
  [/next\/font\/google/i, "build-time Google Fonts network dependency"],
  [/\b(?:dexie|dexie-react-hooks)\b/i, "browser database dependency"],
  [/\bnext-pwa\b/i, "PWA wrapper"],
  [/\b(?:serviceWorker|service-worker|workbox|OfflineIndicator|offline-indicator)\b/i, "offline/PWA runtime"],
];

const violations = [];
for (const filePath of runtimeTargets.flatMap(walk)) {
  const content = fs.readFileSync(filePath, "utf8");
  for (const [pattern, label] of runtimePatterns) {
    if (pattern.test(content)) {
      violations.push(`${path.relative(appRoot, filePath)}: ${label}`);
    }
  }
}
assert.deepEqual(violations, [], `Phase 8 runtime boundary violations:\n${violations.join("\n")}`);

for (const removedLegacyPath of ["supabase", "docs/database"]) {
  assert.equal(
    fs.existsSync(path.join(repoRoot, removedLegacyPath)),
    false,
    `Legacy Supabase archive must not remain in the release tree: ${removedLegacyPath}`,
  );
}
const legacyNumberedDocs = fs.existsSync(path.join(repoRoot, "docs"))
  ? fs.readdirSync(path.join(repoRoot, "docs")).filter((fileName) => /^\d{2}-.+\.md$/.test(fileName))
  : [];
assert.deepEqual(
  legacyNumberedDocs,
  [],
  `Legacy v2 documentation must not remain beside active release docs:\n${legacyNumberedDocs.join("\n")}`,
);

const publicFiles = walk("public").map((filePath) => path.basename(filePath).toLowerCase());
assert.equal(
  publicFiles.some((fileName) => /^(?:sw|service-worker|workbox-.+)\.(?:js|mjs)$/.test(fileName)),
  false,
  "Generated service worker output remains in public/",
);

if (process.argv.includes("--build-output")) {
  const buildTargets = [".next/server/app", ".next/server/chunks", ".next/static"];
  const buildViolations = [];
  for (const filePath of buildTargets.flatMap(walk).filter(isTextBuildFile)) {
    const content = fs.readFileSync(filePath, "utf8");
    if (
      /@supabase\/|NEXT_PUBLIC_SUPABASE_(?:URL|ANON_KEY)|SUPABASE_SERVICE_ROLE_KEY|supabase\.co/i.test(
        content,
      )
    ) {
      buildViolations.push(path.relative(appRoot, filePath));
    }
  }
  assert.deepEqual(
    buildViolations,
    [],
    `Supabase reference remains in production output:\n${buildViolations.join("\n")}`,
  );
}

console.log(
  `Phase 8 release boundary passed${process.argv.includes("--build-output") ? " (source and build output)" : " (source)"}.`,
);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(appRoot, relativePath), "utf8"));
}

function walk(targetPath) {
  const absolutePath = path.join(appRoot, targetPath);
  if (!fs.existsSync(absolutePath)) return [];
  const stat = fs.lstatSync(absolutePath);
  if (stat.isSymbolicLink()) return [];
  if (stat.isFile()) return [absolutePath];

  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return [];
    return walk(path.relative(appRoot, path.join(absolutePath, entry.name)));
  });
}

function isTextBuildFile(filePath) {
  return /\.(?:html|js|json|mjs|rsc|txt)$/.test(filePath);
}
