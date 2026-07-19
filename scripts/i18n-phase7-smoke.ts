import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  compareCatalogKeys,
  createTranslatorFromMessages,
  flattenCatalog,
  I18N_NAMESPACES,
} from "../lib/i18n";
import { enCatalog } from "../locales/en";
import { trCatalog } from "../locales/tr";
import { directionForLocale } from "../server/i18n/locale";

const parity = compareCatalogKeys(trCatalog, enCatalog, I18N_NAMESPACES);
assert.deepEqual(parity, { missingInLeft: [], missingInRight: [] }, "TR/EN catalog keys must match");

const requiredKeys = [
  "auth.login.title",
  "auth.login.description",
  "auth.language",
  "auth.forgot.title",
  "auth.reset.title",
  "auth.messages.invalidCredentials",
  "auth.messages.setupUnavailable",
  "common.notFound.title",
  "common.error.title",
  "common.maintenance.title",
  "validation.unsupportedLocale",
];

for (const catalog of [trCatalog, enCatalog]) {
  const messages = flattenCatalog(catalog, I18N_NAMESPACES);
  for (const key of requiredKeys) {
    assert.ok(messages[key], `${key} must exist in built-in catalogs`);
  }
}

const tr = createTranslatorFromMessages("tr", flattenCatalog(trCatalog, I18N_NAMESPACES));
const en = createTranslatorFromMessages("en", flattenCatalog(enCatalog, I18N_NAMESPACES));

assert.equal(
  tr.t("auth.marketing.description", { app: "Neta" }).includes("Neta"),
  true,
  "auth marketing interpolation must keep app name",
);
assert.equal(en.t("common.itemsCount", { count: 1 }), "1 item");
assert.equal(en.t("common.itemsCount", { count: 2 }), "2 items");
assert.equal(directionForLocale("ar"), "rtl");
assert.equal(directionForLocale("he-IL"), "rtl");
assert.equal(directionForLocale("tr"), "ltr");

const loginActions = fs.readFileSync(path.join(process.cwd(), "app", "login", "actions.ts"), "utf8");
assert.equal(loginActions.includes("message=${encodeURIComponent"), false, "login action redirects must use stable codes");
assert.equal(loginActions.includes("E-posta veya"), false, "login action must not embed Turkish user-facing errors");

const inviteActions = fs.readFileSync(path.join(process.cwd(), "app", "invite", "[token]", "actions.ts"), "utf8");
assert.equal(inviteActions.includes("message=${encodeURIComponent"), false, "invite action redirects must use stable codes");

const localeApi = fs.readFileSync(path.join(process.cwd(), "app", "api", "i18n", "locale", "route.ts"), "utf8");
assert.equal(localeApi.includes("Dil kodu"), false, "locale API must not embed Turkish validation messages");
assert.equal(localeApi.includes("messageKey"), true, "locale API must expose messageKey for localized clients");

console.log("I18n phase 7 auth/error/a11y smoke passed.");
