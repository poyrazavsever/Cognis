import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import {
  contentInputName,
  contentTranslationRegistry,
  type ContentTranslationInput,
} from "../../lib/i18n/content";
import {
  contentTranslations,
  instanceI18nSettings,
  instanceLocales,
  type TranslationEntityType,
} from "../db/schema";
import type { DomainActor } from "../domain/actor";
import type { DomainDatabase } from "../domain/database";
import { DomainError } from "../domain/errors";
import { I18nService, type LocaleRecord } from "./service";

export type ContentTranslationRow = {
  entityType: TranslationEntityType;
  entityId: string;
  field: string;
  locale: string;
  value: string;
};

export type ContentLocalizationContext = {
  defaultLocale: string;
  locales: LocaleRecord[];
};

export class ContentTranslationService {
  constructor(private readonly db: DomainDatabase) {}

  getLocalizationContext(actor: DomainActor): ContentLocalizationContext {
    const i18n = new I18nService(this.db);
    const settings = i18n.getSettings(actor);
    const locales = i18n
      .listLocales(actor)
      .filter((locale) => locale.status !== "archived")
      .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));

    return {
      defaultLocale: settings.defaultLocale,
      locales,
    };
  }

  getPublicLocalizationContext(): ContentLocalizationContext {
    const settings = this.db
      .select()
      .from(instanceI18nSettings)
      .where(eq(instanceI18nSettings.key, "default"))
      .get();
    const locales = this.db
      .select()
      .from(instanceLocales)
      .where(eq(instanceLocales.status, "active"))
      .orderBy(instanceLocales.sortOrder, instanceLocales.code)
      .all()
      .map(toContentLocaleRecord);

    return {
      defaultLocale: settings?.defaultLocale ?? "tr",
      locales,
    };
  }

  listEntityTranslations(entityType: TranslationEntityType, entityId: string): ContentTranslationRow[] {
    return this.db
      .select()
      .from(contentTranslations)
      .where(and(eq(contentTranslations.entityType, entityType), eq(contentTranslations.entityId, entityId)))
      .all()
      .map(toContentTranslationRow);
  }

  listBatch(entityType: TranslationEntityType, entityIds: readonly string[]): Map<string, ContentTranslationRow[]> {
    const uniqueIds = [...new Set(entityIds)].filter(Boolean);
    const result = new Map<string, ContentTranslationRow[]>();
    if (uniqueIds.length === 0) return result;

    for (const row of this.db
      .select()
      .from(contentTranslations)
      .where(and(eq(contentTranslations.entityType, entityType), inArray(contentTranslations.entityId, uniqueIds)))
      .all()
      .map(toContentTranslationRow)) {
      const rows = result.get(row.entityId) ?? [];
      rows.push(row);
      result.set(row.entityId, rows);
    }

    return result;
  }

  upsertEntityTranslations(
    entityType: TranslationEntityType,
    entityId: string,
    input: ContentTranslationInput | null | undefined,
  ) {
    const fields = new Set(contentTranslationRegistry[entityType].map((field) => field.name));
    if (!input) return;

    for (const [locale, values] of Object.entries(input)) {
      for (const [field, rawValue] of Object.entries(values)) {
        if (!fields.has(field)) continue;
        const value = normalizeOptionalText(rawValue);

        if (!value) {
          this.db
            .delete(contentTranslations)
            .where(
              and(
                eq(contentTranslations.entityType, entityType),
                eq(contentTranslations.entityId, entityId),
                eq(contentTranslations.field, field),
                eq(contentTranslations.locale, locale),
              ),
            )
            .run();
          continue;
        }

        this.db
          .insert(contentTranslations)
          .values({ entityType, entityId, field, locale, value })
          .onConflictDoUpdate({
            target: [
              contentTranslations.entityType,
              contentTranslations.entityId,
              contentTranslations.field,
              contentTranslations.locale,
            ],
            set: {
              value,
              updatedAt: new Date(),
            },
          })
          .run();
      }
    }
  }

  deleteEntityTranslations(entityType: TranslationEntityType, entityId: string) {
    this.db
      .delete(contentTranslations)
      .where(and(eq(contentTranslations.entityType, entityType), eq(contentTranslations.entityId, entityId)))
      .run();
  }

  resolveEntity<T extends Record<string, unknown>>(
    entityType: TranslationEntityType,
    entity: T,
    options: {
      locale: string;
      fallbackLocale?: string | null;
      defaultLocale: string;
      translations?: ContentTranslationRow[];
    },
  ): T {
    const translations = options.translations ?? this.listEntityTranslations(entityType, String(entity.id ?? ""));
    const resolved = { ...entity };

    for (const field of contentTranslationRegistry[entityType]) {
      const value = resolveFieldValue(translations, field.name, [
        options.locale,
        options.fallbackLocale,
        options.defaultLocale,
      ]);
      if (value != null) {
        (resolved as Record<string, unknown>)[field.name] = value;
      }
    }

    return resolved;
  }
}

export function parseContentTranslationsFromFormData(
  formData: FormData,
  entityType: TranslationEntityType,
  context: ContentLocalizationContext,
): ContentTranslationInput {
  const fields = contentTranslationRegistry[entityType];
  const translations: ContentTranslationInput = {};

  for (const locale of context.locales) {
    const values: Record<string, string | null> = {};
    for (const field of fields) {
      const raw = formData.get(contentInputName(locale.code, field.name));
      values[field.name] = normalizeOptionalText(typeof raw === "string" ? raw : null);
    }
    translations[locale.code] = values;
  }

  assertDefaultLocaleRequiredFields(entityType, translations, context.defaultLocale);
  return translations;
}

export function projectBaseFromTranslations<T extends Record<string, unknown>>(
  entityType: TranslationEntityType,
  payload: T,
  translations: ContentTranslationInput,
  defaultLocale: string,
): T {
  const next = { ...payload };
  const defaultValues = translations[defaultLocale] ?? {};

  for (const field of contentTranslationRegistry[entityType]) {
    const value = normalizeOptionalText(defaultValues[field.name]);
    if (value != null) {
      (next as Record<string, unknown>)[field.name] = value;
    }
  }

  return next;
}

export function getContentFallbackLocale(
  locale: string,
  context: ContentLocalizationContext,
): string | null {
  return context.locales.find((item) => item.code === locale)?.fallbackLocale ?? null;
}

function assertDefaultLocaleRequiredFields(
  entityType: TranslationEntityType,
  translations: ContentTranslationInput,
  defaultLocale: string,
) {
  const defaultValues = translations[defaultLocale] ?? {};

  for (const field of contentTranslationRegistry[entityType]) {
    if (!("required" in field) || !field.required) continue;
    if (!normalizeOptionalText(defaultValues[field.name])) {
      throw new DomainError("VALIDATION_ERROR", `${field.label} varsayılan dilde zorunludur.`);
    }
  }
}

function resolveFieldValue(rows: ContentTranslationRow[], field: string, localeChain: Array<string | null | undefined>) {
  const uniqueLocales = [...new Set(localeChain.filter(Boolean) as string[])];
  return rows.find((row) => row.field === field && uniqueLocales.includes(row.locale))?.value ?? null;
}

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toContentTranslationRow(row: typeof contentTranslations.$inferSelect): ContentTranslationRow {
  return {
    entityType: row.entityType,
    entityId: row.entityId,
    field: row.field,
    locale: row.locale,
    value: row.value,
  };
}

function toContentLocaleRecord(row: typeof instanceLocales.$inferSelect): LocaleRecord {
  return {
    code: row.code,
    name: row.name,
    nativeName: row.nativeName,
    status: row.status,
    fallbackLocale: row.fallbackLocale,
    textDirection: row.textDirection,
    builtIn: row.builtIn,
    sortOrder: row.sortOrder,
  };
}
