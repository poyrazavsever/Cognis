import { and, eq, inArray, sql } from "drizzle-orm";
import {
  instanceUiTranslations,
  clients,
  instanceI18nSettings,
  instanceLocales,
  portalInvitations,
  userPreferences,
} from "../db/schema";
import type { DomainDatabase } from "../domain/database";

const I18N_SETTINGS_KEY = "default";

export function createI18nRepository(db: DomainDatabase) {
  return {
    listLocales: () => db.select().from(instanceLocales).orderBy(instanceLocales.sortOrder, instanceLocales.code).all(),
    getLocale: (code: string) =>
      db.select().from(instanceLocales).where(eq(instanceLocales.code, code)).get(),
    createLocale: (value: typeof instanceLocales.$inferInsert) =>
      db.insert(instanceLocales).values(value).returning().get(),
    updateLocale: (code: string, value: Partial<typeof instanceLocales.$inferInsert>) =>
      db.update(instanceLocales).set(value).where(eq(instanceLocales.code, code)).returning().get(),
    getSettings: () =>
      db
        .select()
        .from(instanceI18nSettings)
        .where(eq(instanceI18nSettings.key, I18N_SETTINGS_KEY))
        .get(),
    createSettingsIfMissing: () =>
      db
        .insert(instanceI18nSettings)
        .values({ key: I18N_SETTINGS_KEY, defaultLocale: "tr", catalogVersion: 1 })
        .onConflictDoNothing({ target: instanceI18nSettings.key })
        .run(),
    updateDefaultLocale: (code: string) =>
      db
        .update(instanceI18nSettings)
        .set({
          defaultLocale: code,
          updatedAt: new Date(),
        })
        .where(eq(instanceI18nSettings.key, I18N_SETTINGS_KEY))
        .returning()
        .get(),
    listUiTranslations: (locale: string, namespaces: readonly string[]) => {
      if (namespaces.length === 0) return [];

      return db
        .select({
          locale: instanceUiTranslations.locale,
          namespace: instanceUiTranslations.namespace,
          translationKey: instanceUiTranslations.translationKey,
          value: instanceUiTranslations.value,
        })
        .from(instanceUiTranslations)
        .where(
          and(
            eq(instanceUiTranslations.locale, locale),
            inArray(instanceUiTranslations.namespace, [...namespaces]),
          ),
        )
        .all();
    },
    listAllUiTranslations: () =>
      db
        .select({
          locale: instanceUiTranslations.locale,
          namespace: instanceUiTranslations.namespace,
          translationKey: instanceUiTranslations.translationKey,
          value: instanceUiTranslations.value,
        })
        .from(instanceUiTranslations)
        .orderBy(
          instanceUiTranslations.locale,
          instanceUiTranslations.namespace,
          instanceUiTranslations.translationKey,
        )
        .all(),
    upsertUiTranslation: (value: typeof instanceUiTranslations.$inferInsert) =>
      db
        .insert(instanceUiTranslations)
        .values(value)
        .onConflictDoUpdate({
          target: [
            instanceUiTranslations.locale,
            instanceUiTranslations.namespace,
            instanceUiTranslations.translationKey,
          ],
          set: {
            value: value.value,
            updatedAt: new Date(),
          },
        })
        .run(),
    deleteUiTranslation: (locale: string, namespace: string, translationKey: string) =>
      db
        .delete(instanceUiTranslations)
        .where(
          and(
            eq(instanceUiTranslations.locale, locale),
            eq(instanceUiTranslations.namespace, namespace),
            eq(instanceUiTranslations.translationKey, translationKey),
          ),
        )
        .run(),
    bumpCatalogVersion: () =>
      db
        .update(instanceI18nSettings)
        .set({
          catalogVersion: sql`${instanceI18nSettings.catalogVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(instanceI18nSettings.key, I18N_SETTINGS_KEY))
        .run(),
    countLocaleReferences: (code: string) => ({
      defaultSettings: Number(
        db
          .select({ count: sql<number>`count(*)` })
          .from(instanceI18nSettings)
          .where(eq(instanceI18nSettings.defaultLocale, code))
          .get()?.count ?? 0,
      ),
      fallbacks: Number(
        db
          .select({ count: sql<number>`count(*)` })
          .from(instanceLocales)
          .where(eq(instanceLocales.fallbackLocale, code))
          .get()?.count ?? 0,
      ),
      userPreferences: Number(
        db
          .select({ count: sql<number>`count(*)` })
          .from(userPreferences)
          .where(eq(userPreferences.language, code))
          .get()?.count ?? 0,
      ),
      clients: Number(
        db
          .select({ count: sql<number>`count(*)` })
          .from(clients)
          .where(eq(clients.portalLocale, code))
          .get()?.count ?? 0,
      ),
      portalInvitations: Number(
        db
          .select({ count: sql<number>`count(*)` })
          .from(portalInvitations)
          .where(eq(portalInvitations.locale, code))
          .get()?.count ?? 0,
      ),
    }),
  };
}
