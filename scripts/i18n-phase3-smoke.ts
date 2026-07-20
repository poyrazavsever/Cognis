import assert from "node:assert/strict";
import { getSqliteConnection } from "../server/db/client";
import type { DomainActor } from "../server/domain/actor";
import { DomainError } from "../server/domain/errors";
import {
  ACTIVATION_CRITICAL_KEYS,
  I18nService,
} from "../server/i18n/service";

const owner: DomainActor = {
  authUserId: "phase3-owner",
  role: "freelancer",
  clientId: null,
  disabled: false,
};
const client: DomainActor = {
  authUserId: "phase3-client-user",
  role: "client",
  clientId: "phase3-client",
  disabled: false,
};

const service = new I18nService(getSqliteConnection().db);
service.listLocales(owner);

assertDomainError(() => service.listLocales(client), "FORBIDDEN");

const fr = service.createLocale(owner, {
  code: "fr",
  name: "French",
  nativeName: "Français",
  fallbackLocale: "en",
});
assert.equal(fr.status, "draft");

const beforeCompletion = service.getCompletion(owner).find((item) => item.locale === "fr");
assert.ok(beforeCompletion);
assert.ok(beforeCompletion.missingKeys.includes("navigation.items.projects"));

service.upsertUiTranslation(owner, {
  locale: "fr",
  namespace: "navigation",
  key: "items.projects",
  value: "Projets",
});

const exported = service.exportPackage(owner);
assert.equal(exported.format, "neta-i18n");
assert.equal(exported.translations.some((row) => row.locale === "fr" && row.value === "Projets"), true);

service.resetUiTranslation(owner, {
  locale: "fr",
  namespace: "navigation",
  key: "items.projects",
});
assert.equal(
  service.listUiTranslations(owner).some((row) => row.locale === "fr" && row.value === "Projets"),
  false,
);

service.importPackage(owner, exported);
assert.equal(
  service.listUiTranslations(owner).some((row) => row.locale === "fr" && row.value === "Projets"),
  true,
);

assertDomainError(() => service.updateLocale(owner, "fr", { status: "active" }), "VALIDATION_ERROR");
completeCriticalTranslations(service, "fr");
service.updateLocale(owner, "fr", { status: "active" });
assert.equal(service.setDefaultLocale(owner, "fr").defaultLocale, "fr");
assertDomainError(() => service.archiveLocale(owner, "fr"), "CONFLICT");

console.log("I18n phase 3 settings smoke passed.");

function assertDomainError(run: () => unknown, code: DomainError["code"]): void {
  assert.throws(run, (error) => error instanceof DomainError && error.code === code);
}

function completeCriticalTranslations(service: I18nService, locale: string) {
  for (const fullKey of ACTIVATION_CRITICAL_KEYS) {
    const [namespace, ...keyParts] = fullKey.split(".");
    service.upsertUiTranslation(owner, {
      locale,
      namespace,
      key: keyParts.join("."),
      value: `${locale}:${fullKey}`,
    });
  }
}
