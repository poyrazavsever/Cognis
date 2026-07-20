import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { compareCatalogKeys, I18N_NAMESPACES } from "../lib/i18n";
import { trCatalog } from "../locales/tr";
import { enCatalog } from "../locales/en";

const authPages = [
  "app/register/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
];

const basePath = join(process.cwd());

for (const page of authPages) {
  const content = readFileSync(join(basePath, page), "utf8");

  // Rule 1: No LocaleSelect
  assert.equal(content.includes("<LocaleSelect"), false, `${page} contains LocaleSelect`);
  assert.equal(content.includes("locale-select-form"), false, `${page} contains locale-select-form`);

  // Rule 2: Must use resolvePublicLocale
  assert.equal(content.includes("resolvePublicLocale"), true, `${page} missing resolvePublicLocale`);
}

const result = compareCatalogKeys(trCatalog as any, enCatalog as any, ["auth"]);

const authMissingInEn = result.missingInRight.filter((k: string) => k.startsWith("auth."));
const authMissingInTr = result.missingInLeft.filter((k: string) => k.startsWith("auth."));

assert.equal(authMissingInEn.length, 0, `Missing in EN: ${authMissingInEn.join(", ")}`);
assert.equal(authMissingInTr.length, 0, `Missing in TR: ${authMissingInTr.join(", ")}`);

console.log("I18n V2 auth pages smoke passed.");
