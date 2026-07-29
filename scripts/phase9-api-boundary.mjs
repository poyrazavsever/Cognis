import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const requiredRoutes = [
  "app/.well-known/neta/route.ts",
  "app/api/v1/meta/route.ts",
  "app/api/v1/health/route.ts",
  "app/api/v1/me/route.ts",
];
for (const route of requiredRoutes) {
  assert.ok(fs.existsSync(path.join(repoRoot, route)), `Missing Phase 9 route: ${route}`);
}

const contracts = read("server/api/v1/contracts.ts");
for (const value of [
  'NETA_PROTOCOL = "neta"',
  "NETA_DISCOVERY_VERSION = 1",
  'NETA_API_VERSION = "1"',
  'id: "mobile-v1"',
  "NETA_CAPABILITY_DETAILS",
  '"instance.localization"',
  '"auth.device-pairing"',
  'status: "planned"',
  "minimumSupportedVersion",
  "workspaceName",
  "metaTitle",
  "faviconUrl",
  "NetaLocalizedResponse",
  "NetaTranslationMutationShape",
  "ownerMutationTranslations",
  "absoluteUrl",
]) {
  assert.ok(contracts.includes(value), `Missing API contract marker: ${value}`);
}

const localization = read("server/api/v1/localization.ts");
for (const value of [
  "parseAcceptLanguage",
  "negotiateLocale",
  "UNSUPPORTED_LOCALE",
  "Accept-Language",
  "exact-or-base-language",
]) {
  assert.ok(localization.includes(value), `Missing localization contract marker: ${value}`);
}

const instanceService = read("server/instance/service.ts");
assert.doesNotMatch(
  instanceService,
  /next\/|Request\b|Response\b|cookies?\b|headers?\b/i,
  "Instance service must stay independent from Next.js transport objects",
);

const discovery = read("app/.well-known/neta/route.ts");
assert.doesNotMatch(
  discovery,
  /getSession|requireSession|authorization/i,
  "Discovery must remain public and session-independent",
);
assert.match(
  read("app/api/v1/me/route.ts"),
  /getUserPreferences/,
  "Authenticated mobile metadata must expose the persisted user color mode",
);
assert.match(
  read("app/api/v1/me/route.ts"),
  /resolvedLocale/,
  "Authenticated mobile metadata must expose resolved localization state",
);
assert.match(
  read("app/api/v1/me/route.ts"),
  /portalLocale/,
  "Authenticated mobile metadata must expose client portal locale when available",
);

assert.match(
  read("app/api/v1/meta/route.ts"),
  /stale-while-revalidate=300/,
  "Meta endpoint must keep a public revalidation cache contract",
);

const domainErrors = read("server/domain/errors.ts");
assert.match(
  domainErrors,
  /UNSUPPORTED_LOCALE/,
  "Unsupported locale must have a stable API error code",
);

for (const fixture of [
  "docs/self-hosted-redesign/i18n-phase-8-fixtures/api-v1-locale-tr.json",
  "docs/self-hosted-redesign/i18n-phase-8-fixtures/api-v1-locale-en.json",
  "docs/self-hosted-redesign/i18n-phase-8-fixtures/api-v1-locale-fr.json",
]) {
  const parsed = JSON.parse(read(fixture));
  assert.ok(parsed.request, `Missing request fixture in ${fixture}`);
  assert.ok(parsed.expected, `Missing expected fixture in ${fixture}`);
}

for (const route of requiredRoutes.slice(1)) {
  const content = read(route);
  assert.match(content, /apiV1(?:Success|Error)/, `${route} must use the v1 envelope`);
}

for (const futureRoute of [
  "app/api/v1/pairing-codes",
  "app/api/v1/device-sessions",
]) {
  assert.equal(
    fs.existsSync(path.join(repoRoot, futureRoute)),
    false,
    `${futureRoute} must not ship before the pairing security design is implemented`,
  );
}

const runtimeFiles = [
  ...requiredRoutes,
  "server/api/v1/contracts.ts",
  "server/api/v1/localization.ts",
  "server/api/v1/responses.ts",
  "server/api/v1/runtime.ts",
  "server/instance/service.ts",
  "server/instance/runtime.ts",
  "server/repositories/instance.ts",
];
for (const file of runtimeFiles) {
  assert.doesNotMatch(read(file), /@supabase\/|supabase\.co/i, `Supabase reference in ${file}`);
}

console.log("Phase 9 API boundary passed: discovery, v1 contracts and pairing scope verified.");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}
