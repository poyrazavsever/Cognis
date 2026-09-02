import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const expectedPages = [
  "app/(dashboard)/page.tsx",
  "app/(dashboard)/analytics/page.tsx",
  "app/(dashboard)/calendar/page.tsx",
  "app/(dashboard)/chat/page.tsx",
  "app/(dashboard)/clients/page.tsx",
  "app/(dashboard)/clients/[id]/page.tsx",
  "app/(dashboard)/finance/page.tsx",
  "app/(dashboard)/journal/page.tsx",
  "app/(dashboard)/projects/page.tsx",
  "app/(dashboard)/projects/[id]/page.tsx",
  "app/(dashboard)/tasks/page.tsx",
  "app/(dashboard)/business/invoices/page.tsx",
  "app/(dashboard)/business/proposals/page.tsx",
  "app/(dashboard)/business/subscriptions/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/invite/[token]/page.tsx",
  "app/portal/page.tsx",
  "app/portal/projects/page.tsx",
  "app/portal/projects/[id]/page.tsx",
  "app/portal/revisions/page.tsx",
  "app/portal/tasks/page.tsx",
];
const authPages = [
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
];
const settingsPages = [
  "app/(dashboard)/settings/general/page.tsx",
  "app/(dashboard)/settings/appearance/page.tsx",
  "app/(dashboard)/settings/profile/page.tsx",
  "app/(dashboard)/settings/security/page.tsx",
  "app/(dashboard)/settings/ai/page.tsx",
  "app/(dashboard)/settings/language/page.tsx",
  "app/(dashboard)/settings/languages/page.tsx",
  "app/(dashboard)/settings/languages/new/page.tsx",
  "app/(dashboard)/settings/languages/[locale]/page.tsx",
];
const completedSettingsPageFiles = [
  "app/(dashboard)/settings/general/page.tsx",
  "app/(dashboard)/settings/general/general-settings-form.tsx",
  "app/(dashboard)/settings/general/actions.ts",
  "app/(dashboard)/settings/appearance/page.tsx",
  "app/(dashboard)/settings/appearance/appearance-settings-form.tsx",
  "app/(dashboard)/settings/appearance/actions.ts",
  "app/(dashboard)/settings/profile/page.tsx",
  "app/(dashboard)/settings/profile/profile-settings-form.tsx",
  "app/(dashboard)/settings/profile/actions.ts",
  "app/(dashboard)/settings/security/page.tsx",
  "app/(dashboard)/settings/security/security-settings-form.tsx",
  "app/(dashboard)/settings/security/actions.ts",
  "app/(dashboard)/settings/ai/page.tsx",
  "app/(dashboard)/settings/ai/ai-settings-form.tsx",
  "app/(dashboard)/settings/ai/actions.ts",
  "app/(dashboard)/settings/language/page.tsx",
  "app/(dashboard)/settings/language/language-preference-form.tsx",
  "app/(dashboard)/settings/language/actions.ts",
  "app/(dashboard)/settings/languages/page.tsx",
  "app/(dashboard)/settings/languages/languages-list.tsx",
  "app/(dashboard)/settings/languages/actions.ts",
  "app/(dashboard)/settings/languages/new/page.tsx",
  "app/(dashboard)/settings/languages/new/new-language-form.tsx",
  "app/(dashboard)/settings/languages/new/actions.ts",
  "app/(dashboard)/settings/languages/[locale]/page.tsx",
  "app/(dashboard)/settings/languages/[locale]/language-detail.tsx",
  "app/(dashboard)/settings/languages/[locale]/actions.ts",
];

for (const file of [...expectedPages, ...settingsPages]) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing planned page: ${file}`);
}

for (const file of authPages) {
  const source = read(file);
  assert.ok(source.includes("resolvePublicLocale"), `${file} must use the public locale resolver`);
  assert.ok(!source.includes("LocaleSelectForm"), `${file} must not expose a locale selector`);
}

for (const file of completedSettingsPageFiles) {
  const source = read(file);
  assert.ok(
    !/[ÇĞİÖŞÜçğıöşü]/.test(source),
    `${file} must not contain hard-coded Turkish user-facing text`,
  );
  assert.ok(
    !source.includes('from "../settings-content"'),
    `${file} must not depend on the transitional settings monolith`,
  );
}
for (const route of ["general", "appearance", "profile", "security", "ai", "language"]) {
  assert.ok(
    fs.existsSync(path.join(root, `app/(dashboard)/settings/${route}/actions.ts`)),
    `${route} settings must have a route-specific server action boundary`,
  );
}
const generalPage = read("app/(dashboard)/settings/general/page.tsx");
assert.ok(
  generalPage.includes('locale.status === "active"'),
  "General settings must render content tabs for active locales only",
);
const appearancePage = read("app/(dashboard)/settings/appearance/appearance-settings-form.tsx");
for (const marker of ["applyColorMode", "sm:grid-cols-3", "lightLogo", "darkLogo", "favicon"]) {
  assert.ok(appearancePage.includes(marker), `Appearance regression marker is missing: ${marker}`);
}
const appearanceActions = read("app/(dashboard)/settings/appearance/actions.ts");
for (const marker of ["deleteSupersededBrandingFiles", "deleteBrandingFilesBestEffort", "requireFreelancerBackend"]) {
  assert.ok(appearanceActions.includes(marker), `Appearance action safety marker is missing: ${marker}`);
}
const securityActions = read("app/(dashboard)/settings/security/actions.ts");
for (const marker of ["changePassword", "revokeOtherSessions: true", "errorKey"]) {
  assert.ok(securityActions.includes(marker), `Security action marker is missing: ${marker}`);
}
const aiPage = read("app/(dashboard)/settings/ai/page.tsx");
const aiForm = read("app/(dashboard)/settings/ai/ai-settings-form.tsx");
const aiService = read("server/settings/ai.ts");
assert.ok(aiPage.includes("getPublicAiSettings"), "AI settings must use owner-scoped public settings");
assert.ok(!aiPage.includes("apiKey:"), "AI settings page must never send a secret to the client");
for (const marker of ["model", "hasApiKey", "apiKey.masked"]) {
  assert.ok(aiForm.includes(marker), `AI settings UX marker is missing: ${marker}`);
}
assert.ok(aiService.includes("model,"), "AI model selection must be persisted");
const languagePage = read("app/(dashboard)/settings/language/page.tsx");
const languageForm = read("app/(dashboard)/settings/language/language-preference-form.tsx");
assert.ok(
  languagePage.includes('locale.status === "active"'),
  "Language preference must list active locales only",
);
for (const marker of ["nativeName", "defaultLocale", "preferenceNeedsSelection", "router.refresh()"]) {
  assert.ok(languageForm.includes(marker), `Language preference marker is missing: ${marker}`);
}
assert.ok(
  !fs.existsSync(path.join(root, "app/(dashboard)/settings/settings-content.tsx")),
  "The transitional settings monolith must be removed",
);
assert.ok(
  !fs.existsSync(path.join(root, "app/(dashboard)/settings/actions.ts")),
  "The obsolete shared settings action boundary must be removed",
);
const languagesList = read("app/(dashboard)/settings/languages/languages-list.tsx");
for (const marker of ["completion", "usage", "makeDefault", "archived"]) {
  assert.ok(languagesList.includes(marker), `Language list marker is missing: ${marker}`);
}
const languageNewAction = read("app/(dashboard)/settings/languages/new/actions.ts");
for (const marker of ["Intl.getCanonicalLocales", "SUPPORTED_BCP47_PATTERN", "createLocale"]) {
  assert.ok(languageNewAction.includes(marker), `New language marker is missing: ${marker}`);
}
const languageDetail = read("app/(dashboard)/settings/languages/[locale]/language-detail.tsx");
for (const marker of ["namespaceCompletion", "readiness", "usage", "DestructiveConfirmation"]) {
  assert.ok(languageDetail.includes(marker), `Language detail marker is missing: ${marker}`);
}
const i18nService = read("server/i18n/service.ts");
assert.ok(
  i18nService.includes('status: "draft"'),
  "Custom languages must always be created as draft",
);
for (const marker of ["assertLocaleCanBeActivated", "ACTIVATION_CRITICAL_KEYS", "getLocaleReadiness"]) {
  assert.ok(i18nService.includes(marker), `Language lifecycle service marker is missing: ${marker}`);
}

const resolver = read("server/i18n/resolver.ts");
for (const exportName of [
  "resolvePublicLocale",
  "resolveInvitationLocale",
  "resolveFreelancerLocale",
  "resolvePortalLocale",
]) {
  assert.ok(resolver.includes(exportName), `Resolver export is missing: ${exportName}`);
}
assert.ok(!resolver.includes("LOCALE_COOKIE"), "Server locale authority must not depend on the locale cookie");
assert.ok(
  !fs.existsSync(path.join(root, "app/api/i18n/locale/route.ts")),
  "The obsolete locale-cookie mutation route must not exist",
);
assert.ok(
  !fs.existsSync(path.join(root, "components/i18n/locale-select-form.tsx")),
  "The obsolete public locale selector must not exist",
);

const settingsNavigation = read("app/(dashboard)/settings/settings-navigation.tsx");
assert.ok(settingsNavigation.includes("md:sticky"), "Settings navigation must be sticky on desktop");
assert.ok(settingsNavigation.includes("usePathname"), "Settings navigation must be route-aware");
for (const boundary of ["loading.tsx", "error.tsx", "not-found.tsx"]) {
  assert.ok(
    fs.existsSync(path.join(root, "app/(dashboard)/settings", boundary)),
    `Settings boundary is missing: ${boundary}`,
  );
}

const invitationService = read("server/auth/invitations.ts");
const clientLocaleMutation = invitationService.slice(
  invitationService.indexOf("export function setClientPortalLocale"),
);
assert.ok(
  !clientLocaleMutation.includes("tx.insert(userPreferences)"),
  "Updating the admin-assigned client locale must preserve the client's personal preference",
);

const userFacingFiles = listFiles(["app", "components", "config"])
  .filter((file) => /\.(ts|tsx)$/.test(file));
const hardCodedCandidates = userFacingFiles
  .map((file) => ({
    file,
    count: (read(file).match(/[ÇĞİÖŞÜçğıöşü]/g) ?? []).length,
  }))
  .filter((entry) => entry.count > 0)
  .sort((left, right) => right.count - left.count);

console.log(`I18n V2 page audit passed: ${expectedPages.length + settingsPages.length} page routes accounted for.`);
console.log(`Baseline hard-coded Turkish-character candidates: ${hardCodedCandidates.length} files.`);
for (const entry of hardCodedCandidates.slice(0, 12)) {
  console.log(`  ${entry.count.toString().padStart(4)}  ${entry.file}`);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function listFiles(roots) {
  const result = [];
  for (const rootName of roots) {
    walk(path.join(root, rootName), rootName);
  }
  return result;

  function walk(absolute, relative) {
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      const entryAbsolute = path.join(absolute, entry.name);
      const entryRelative = path.join(relative, entry.name);
      if (entry.isDirectory()) walk(entryAbsolute, entryRelative);
      else result.push(entryRelative);
    }
  }
}
