import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../server/db/schema";
import type { DomainActor } from "../server/domain/actor";
import { DomainError } from "../server/domain/errors";
import {
  ACTIVATION_CRITICAL_KEYS,
  I18nService,
} from "../server/i18n/service";

const databasePath = process.argv[2];
assert.ok(databasePath, "Database path is required");

const sqlite = new Database(databasePath);
sqlite.pragma("foreign_keys = ON");
const db = drizzle({ client: sqlite, schema });

const owner: DomainActor = {
  authUserId: "i18n-owner",
  role: "freelancer",
  clientId: null,
  disabled: false,
};
const client: DomainActor = {
  authUserId: "i18n-client-user",
  role: "client",
  clientId: "i18n-client",
  disabled: false,
};
const disabledOwner: DomainActor = {
  ...owner,
  authUserId: "i18n-disabled-owner",
  disabled: true,
};

try {
  for (const actor of [owner, client, disabledOwner]) {
    db.insert(schema.user).values({
      id: actor.authUserId,
      name: actor.authUserId,
      email: `${actor.authUserId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();
  }

  const service = new I18nService(db);
  const locales = service.listLocales(owner);
  assert.deepEqual(
    locales.map((locale) => ({
      code: locale.code,
      status: locale.status,
      builtIn: locale.builtIn,
      fallbackLocale: locale.fallbackLocale,
    })),
    [
      { code: "tr", status: "active", builtIn: true, fallbackLocale: null },
      { code: "en", status: "active", builtIn: true, fallbackLocale: "tr" },
    ],
  );
  assert.deepEqual(service.getSettings(owner), { defaultLocale: "tr", catalogVersion: 1 });

  assertDomainError(() => service.listLocales(client), "FORBIDDEN");
  assertDomainError(() => service.createLocale(disabledOwner, { code: "fr", name: "French" }), "FORBIDDEN");
  assertDomainError(() => service.createLocale(owner, { code: "english", name: "English" }), "VALIDATION_ERROR");
  assertDomainError(() => service.createLocale(owner, { code: "en", name: "English" }), "CONFLICT");
  assertDomainError(
    () => service.createLocale(owner, { code: "de", name: "German", fallbackLocale: "de" }),
    "VALIDATION_ERROR",
  );
  assertDomainError(
    () => service.createLocale(owner, { code: "pt", name: "Portuguese", fallbackLocale: "zz" }),
    "VALIDATION_ERROR",
  );

  const french = service.createLocale(owner, {
    code: "fr",
    name: "French",
    nativeName: "Français",
    fallbackLocale: "en",
  });
  assert.equal(french.status, "draft");
  assert.equal(french.fallbackLocale, "en");

  service.createLocale(owner, { code: "es", name: "Spanish", fallbackLocale: "fr" });
  assertDomainError(() => service.updateLocale(owner, "fr", { fallbackLocale: "es" }), "VALIDATION_ERROR");
  assertDomainError(() => service.setDefaultLocale(owner, "fr"), "VALIDATION_ERROR");
  completeCriticalTranslations(service, "fr");

  const activeFrench = service.updateLocale(owner, "fr", { status: "active" });
  assert.equal(activeFrench.status, "active");
  assert.equal(service.setDefaultLocale(owner, "fr").defaultLocale, "fr");
  assertDomainError(() => service.archiveLocale(owner, "fr"), "CONFLICT");
  assertDomainError(() => service.archiveLocale(owner, "en"), "CONFLICT");

  const italian = service.createLocale(owner, {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    status: "active",
    fallbackLocale: "en",
  });
  assert.equal(italian.status, "draft", "Custom locales must always start as draft");
  assert.equal(service.getLocaleReadiness(owner, "it").canActivate, false);
  completeCriticalTranslations(service, "it");
  assert.equal(service.getLocaleReadiness(owner, "it").canActivate, true);
  service.updateLocale(owner, "it", { status: "active" });
  db.insert(schema.clients).values({
    id: "i18n-client",
    ownerUserId: owner.authUserId,
    name: "I18n Client",
    authUserId: client.authUserId,
    portalLocale: "it",
  }).run();
  assertDomainError(() => service.archiveLocale(owner, "it"), "CONFLICT");
  assert.ok(
    service.getNamespaceCompletion(owner, "it").some((item) => item.namespace === "portal"),
  );
  assert.equal(service.getLocaleUsage(owner, "it").clients, 1);

  db.insert(schema.contentTranslations).values({
    entityType: "project",
    entityId: "i18n-project",
    field: "name",
    locale: "fr",
    value: "Projet multilingue",
  }).run();

  const persisted = db.select().from(schema.instanceLocales).all();
  assert.equal(persisted.some((locale) => locale.code === "fr" && locale.status === "active"), true);
  assert.equal(
    db.select().from(schema.contentTranslations).all()[0]?.value,
    "Projet multilingue",
  );

  console.log("I18n phase 1 service smoke passed.");
} finally {
  sqlite.close();
}

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
