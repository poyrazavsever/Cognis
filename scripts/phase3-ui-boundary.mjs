import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const checkedPaths = [
  "app/layout.tsx",
  "app/globals.css",
  "app/login",
  "app/register",
  "components/auth",
  "components/layout",
  "components/ui",
  "config/sidebar.ts",
  "config/portal-sidebar.ts",
];

const requiredInternalPrimitives = [
  "components/ui/button.tsx",
  "components/ui/input.tsx",
  "components/ui/field.tsx",
  "components/ui/card.tsx",
  "components/ui/skeleton.tsx",
  "components/ui/toast.tsx",
];

function walk(targetPath) {
  const absolutePath = path.join(repoRoot, targetPath);

  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  const stat = fs.statSync(absolutePath);

  if (stat.isFile()) {
    return [absolutePath];
  }

  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(absolutePath, entry.name);
    const relativePath = path.relative(repoRoot, entryPath);

    if (entry.isDirectory()) {
      return walk(relativePath);
    }

    return /\.(css|tsx?|jsx?)$/.test(entry.name) ? [entryPath] : [];
  });
}

for (const primitive of requiredInternalPrimitives) {
  assert.ok(fs.existsSync(path.join(repoRoot, primitive)), `Missing internal primitive: ${primitive}`);
}

const violations = checkedPaths
  .flatMap(walk)
  .flatMap((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(repoRoot, filePath);
    const matches = [];

    if (content.includes("poyraz-ui")) {
      matches.push(`${relativePath}: imports poyraz-ui`);
    }

    if (content.includes("--poyraz")) {
      matches.push(`${relativePath}: uses --poyraz token`);
    }

    return matches;
  });

assert.deepEqual(violations, [], `UI boundary violations:\n${violations.join("\n")}`);

console.log("Phase 3 UI boundary passed");

