import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const globalsCss = fs.readFileSync(path.join(repoRoot, "app/globals.css"), "utf8");
const appShell = fs.readFileSync(path.join(repoRoot, "components/layout/app-shell.tsx"), "utf8");

assert.match(packageJson.dependencies["poyraz-ui"] ?? "", /^\^?3\./, "poyraz-ui must use major v3");
assert.match(
  packageJson.dependencies.mermaid ?? "",
  /^\^?11\./,
  "Poyraz molecule bundle requires its Mermaid peer to be resolvable at build time",
);
assert.ok(
  globalsCss.includes('@import "poyraz-ui/preset.css";'),
  "Poyraz UI preset must be imported by app/globals.css",
);

for (const component of [
  "SidebarProvider",
  "SidebarPanel",
  "SidebarHeader",
  "SidebarBranding",
  "SidebarContent",
  "SidebarMenu",
  "SidebarMenuItem",
  "SidebarFooter",
  "SidebarTrigger",
  "SidebarUserProfile",
]) {
  assert.ok(appShell.includes(component), `App shell must compose the Poyraz ${component} organism`);
}

const requiredSystemCompositions = [
  "components/system/page-header.tsx",
  "components/system/feedback-state.tsx",
  "components/system/status-badge.tsx",
  "components/system/destructive-confirmation.tsx",
];
for (const file of requiredSystemCompositions) {
  assert.ok(fs.existsSync(path.join(repoRoot, file)), `Missing Neta system composition: ${file}`);
}

const allowedLocalUiFiles = new Set([
  "pending-link.tsx",
  "pending-submit-button.tsx",
]);
const localUiFiles = fs
  .readdirSync(path.join(repoRoot, "components/ui"), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);
assert.deepEqual(
  localUiFiles.sort(),
  [...allowedLocalUiFiles].sort(),
  "components/ui may contain only Neta-specific behavior compositions",
);

const removedDirectUiDependencies = [
  "@base-ui/react",
  "@iconify/react",
  "@radix-ui/react-alert-dialog",
  "@radix-ui/react-checkbox",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-label",
  "@radix-ui/react-select",
  "@radix-ui/react-separator",
  "@radix-ui/react-slot",
  "@radix-ui/react-toast",
  "class-variance-authority",
  "next-themes",
  "radix-ui",
  "shadcn",
];
for (const dependency of removedDirectUiDependencies) {
  assert.equal(packageJson.dependencies[dependency], undefined, `Duplicate UI dependency remains: ${dependency}`);
}

function walk(targetPath) {
  const absolutePath = path.join(repoRoot, targetPath);
  if (!fs.existsSync(absolutePath)) return [];
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) return [absolutePath];

  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(absolutePath, entry.name);
    if (entry.isDirectory()) return walk(path.relative(repoRoot, entryPath));
    return /\.(css|tsx?|jsx?)$/.test(entry.name) ? [entryPath] : [];
  });
}

const violations = ["app", "components"]
  .flatMap(walk)
  .flatMap((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(repoRoot, filePath);
    const matches = [];

    if (/from\s+["']poyraz-ui["']/.test(content)) {
      matches.push(`${relativePath}: imports from the package root instead of atoms/molecules/organisms`);
    }
    if (/@\/components\/ui\/(button|card|checkbox|dialog|dropdown-menu|field|form|icon|input|label|select|separator|skeleton|textarea|toast|toaster)/.test(content)) {
      matches.push(`${relativePath}: imports a removed local generic primitive`);
    }
    return matches;
  });

assert.deepEqual(violations, [], `Phase 4 UI boundary violations:\n${violations.join("\n")}`);
console.log("Phase 4 Poyraz UI boundary passed");
