import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const globalsCss = fs.readFileSync(path.join(repoRoot, "app/globals.css"), "utf8");
const appShell = fs.readFileSync(path.join(repoRoot, "components/layout/app-shell.tsx"), "utf8");
const rootLayout = fs.readFileSync(path.join(repoRoot, "app/layout.tsx"), "utf8");
const settingsPage = fs.readFileSync(
  path.join(repoRoot, "app/(dashboard)/settings/page.tsx"),
  "utf8",
);

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
assert.ok(
  globalsCss.includes("@custom-variant dark (&:where(.dark, .dark *));"),
  "Tailwind dark utilities must follow Neta's explicit root color mode",
);

for (const component of [
  "SidebarProvider",
  "SidebarPanel",
  "SidebarHeader",
  "SidebarContent",
  "SidebarMenu",
  "SidebarMenuItem",
  "SidebarFooter",
  "SidebarTrigger",
  "SidebarUserProfile",
]) {
  assert.ok(appShell.includes(component), `App shell must compose the Poyraz ${component} organism`);
}

assert.ok(appShell.includes("WorkspaceLogo"), "Sidebar header must render the workspace logo");
assert.ok(
  appShell.includes('<SidebarProvider variant="default">'),
  "Desktop sidebar must use the fixed-width Poyraz default variant",
);
assert.ok(
  !appShell.includes('<SidebarProvider variant="collapsible">'),
  "Desktop sidebar must not be collapsible",
);
assert.ok(!appShell.includes("SidebarRail"), "Desktop sidebar must not expose a collapse rail");

assert.doesNotMatch(
  appShell,
  /<DropdownMenuItem(?=[^>]*\basChild\b)(?=[^>]*\bmedia=)[^>]*>/s,
  "Poyraz DropdownMenuItem must not combine asChild with rich media because Radix cannot inject accessibility props into the generated Fragment",
);
assert.doesNotMatch(
  appShell,
  /<DropdownMenuItem[^>]*\binteractiveMotion=/s,
  "Poyraz UI 3.0.2 leaks DropdownMenuItem interactiveMotion to the DOM",
);

assert.match(settingsPage, /\bRadioGroup\b/, "Settings must use the Poyraz RadioGroup for theme selection");
for (const workspaceControl of [
  'name="workspaceName"',
  'name="metaTitle"',
  'name="shortName"',
  'name="lightLogo"',
  'name="darkLogo"',
  'name="favicon"',
  'name="primaryColor"',
]) {
  assert.ok(
    settingsPage.includes(workspaceControl),
    `Settings must expose workspace branding control ${workspaceControl}`,
  );
}
assert.ok(settingsPage.includes('useState("Genel")'), "Workspace and appearance settings must share the General tab");
assert.doesNotMatch(
  settingsPage,
  /\{\s*name:\s*"Görünüm"/,
  "Appearance must not remain as a separate settings tab",
);
for (const colorMode of ["light", "dark", "system"]) {
  assert.ok(
    settingsPage.includes(`value: "${colorMode}"`),
    `Settings must expose the ${colorMode} color mode`,
  );
}
assert.ok(
  rootLayout.includes("COLOR_MODE_COOKIE"),
  "Root layout must resolve the persisted color mode before rendering",
);
assert.ok(
  appShell.includes("ColorModeSync"),
  "Authenticated shells must synchronize the database-backed color mode",
);
assert.ok(
  fs.existsSync(path.join(repoRoot, "server/settings/preferences.ts")),
  "Missing database-backed user preferences service",
);
assert.match(
  settingsPage,
  /md:sticky md:top-8/,
  "The desktop settings navigation must remain sticky while its content scrolls",
);
assert.equal(
  fs.existsSync(path.join(repoRoot, "app/favicon.ico")),
  false,
  "Static App Router favicon must not override database-backed branding metadata",
);

const requiredSystemCompositions = [
  "components/system/page-header.tsx",
  "components/system/feedback-state.tsx",
  "components/system/status-badge.tsx",
  "components/system/destructive-confirmation.tsx",
  "components/system/stat-card.tsx",
];
for (const file of requiredSystemCompositions) {
  assert.ok(fs.existsSync(path.join(repoRoot, file)), `Missing Neta system composition: ${file}`);
}

const statCard = fs.readFileSync(
  path.join(repoRoot, "components/system/stat-card.tsx"),
  "utf8",
);
for (const semanticTone of [
  "bg-success text-success-icon",
  "bg-info text-info-icon",
  "bg-warning text-warning-icon",
  "bg-destructive-muted text-destructive-muted-foreground",
]) {
  assert.ok(
    statCard.includes(semanticTone),
    `Stat cards must use Poyraz's theme-aware ${semanticTone} tokens`,
  );
}

for (const statPage of [
  "app/(dashboard)/dashboard-client.tsx",
  "app/(dashboard)/clients/clients-client.tsx",
  "app/(dashboard)/projects/projects-client.tsx",
  "app/(dashboard)/journal/journal-client.tsx",
  "app/(dashboard)/finance/finance-client.tsx",
]) {
  const content = fs.readFileSync(path.join(repoRoot, statPage), "utf8");
  assert.ok(
    content.includes('from "@/components/system/stat-card"'),
    `${statPage} must use the shared theme-aware stat card`,
  );
}

const financePage = fs.readFileSync(
  path.join(repoRoot, "app/(dashboard)/finance/finance-client.tsx"),
  "utf8",
);
for (const sliderBehavior of [
  "financeSummaryCardConfig",
  "featured: true",
  "snap-mandatory",
  "overflow-x-auto",
  "scrollBy",
  'event.key === "ArrowLeft"',
  'event.key === "ArrowRight"',
]) {
  assert.ok(
    financePage.includes(sliderBehavior),
    `Finance summary slider is missing ${sliderBehavior}`,
  );
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
