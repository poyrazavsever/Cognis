import assert from "node:assert/strict";
import {
  compareCatalogKeys,
  createTranslatorFromMessages,
  formatDate,
  formatMoney,
  I18N_NAMESPACES,
} from "../lib/i18n";
import { enCatalog } from "../locales/en";
import { trCatalog } from "../locales/tr";
import { getSqliteConnection } from "../server/db/client";
import type { DomainActor } from "../server/domain/actor";
import { DomainError } from "../server/domain/errors";
import { I18nService } from "../server/i18n/service";
import { directionForLocale } from "../server/i18n/locale";
import { createTranslator } from "../server/i18n/translator";

const owner: DomainActor = {
  authUserId: "i18n-phase2-owner",
  role: "freelancer",
  clientId: null,
  disabled: false,
};
const client: DomainActor = {
  authUserId: "i18n-phase2-client",
  role: "client",
  clientId: "i18n-phase2-client",
  disabled: false,
};

const parity = compareCatalogKeys(trCatalog, enCatalog, I18N_NAMESPACES);
assert.deepEqual(parity, { missingInLeft: [], missingInRight: [] }, "TR/EN catalog keys must match");

const clientTranslator = createTranslatorFromMessages("en", {
  "common.greeting": "Hello {name}",
  "common.items": "{count, plural, one {# item} other {# items}}",
});
assert.equal(clientTranslator.t("common.greeting", { name: "Neta" }), "Hello Neta");
assert.equal(clientTranslator.t("common.items", { count: 1 }), "1 item");
assert.equal(clientTranslator.t("common.items", { count: 3 }), "3 items");
assert.equal(directionForLocale("ar-XB"), "rtl");
assert.match(formatDate("2026-07-19", "en"), /July/);
assert.match(formatMoney(12345, "USD", "en"), /\$123\.45/);

const service = new I18nService(getSqliteConnection().db);
service.listLocales(owner);

const tr = createTranslator("tr", ["common"]);
const en = createTranslator("en", ["common"]);
assert.equal(tr.t("common.actions.save"), "Kaydet");
assert.equal(en.t("common.actions.save"), "Save");

service.createLocale(owner, {
  code: "fr",
  name: "French",
  nativeName: "Français",
  fallbackLocale: "en",
});
service.upsertUiTranslation(owner, {
  locale: "fr",
  namespace: "common",
  key: "actions.save",
  value: "Enregistrer",
});
assertDomainError(
  () => service.upsertUiTranslation(client, {
    locale: "fr",
    namespace: "common",
    key: "actions.cancel",
    value: "Annuler",
  }),
  "FORBIDDEN",
);

const fr = createTranslator("fr", ["common"]);
assert.equal(fr.t("common.actions.save"), "Enregistrer");
assert.equal(fr.t("common.actions.cancel"), "Cancel");
assert.equal(fr.t("common.missing.key"), "common.missing.key");

service.upsertUiTranslation(owner, {
  locale: "fr",
  namespace: "common",
  key: "actions.cancel",
  value: "Annuler",
});
const frAfterBump = createTranslator("fr", ["common"]);
assert.equal(frAfterBump.t("common.actions.cancel"), "Annuler");

console.log("I18n phase 2 runtime smoke passed.");

function assertDomainError(run: () => unknown, code: DomainError["code"]): void {
  assert.throws(run, (error) => error instanceof DomainError && error.code === code);
}
