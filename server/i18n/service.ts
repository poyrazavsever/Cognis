import type { LocaleStatus, TextDirection } from "../db/schema";
import {
  DEFAULT_LOCALE,
  I18N_NAMESPACES,
  compareCatalogKeys,
  flattenCatalog,
  getBuiltInCatalog,
  type I18nNamespace,
} from "../../lib/i18n";
import { trCatalog } from "../../locales/tr";
import { requireOwnerScope, type DomainActor } from "../domain/actor";
import type { DomainDatabase } from "../domain/database";
import { DomainError, notFound } from "../domain/errors";
import { createI18nRepository } from "../repositories/i18n";

export type LocaleRecord = {
  code: string;
  name: string;
  nativeName: string;
  status: LocaleStatus;
  fallbackLocale: string | null;
  textDirection: TextDirection;
  builtIn: boolean;
  sortOrder: number;
};

export type I18nSettingsRecord = {
  defaultLocale: string;
  catalogVersion: number;
};

export type CreateLocaleInput = {
  code: string;
  name: string;
  nativeName?: string;
  fallbackLocale?: string | null;
  textDirection?: TextDirection;
  status?: LocaleStatus;
  sortOrder?: number;
};

export type UpdateLocaleInput = Partial<Omit<CreateLocaleInput, "code">>;

export type UpsertUiTranslationInput = {
  locale: string;
  namespace: string;
  key: string;
  value: string;
};

export type UiTranslationRow = {
  locale: string;
  namespace: string;
  key: string;
  value: string;
};

export type I18nExportPackage = {
  format: "neta-i18n";
  version: 1;
  exportedAt: string;
  defaultLocale: string;
  locales: LocaleRecord[];
  translations: UiTranslationRow[];
};

export type TranslationCompletion = {
  locale: string;
  translated: number;
  total: number;
  percent: number;
  missingKeys: string[];
};

export type NamespaceCompletion = {
  namespace: I18nNamespace;
  translated: number;
  total: number;
  percent: number;
  missingKeys: string[];
};

export type LocaleUsage = {
  defaultSettings: number;
  fallbacks: number;
  userPreferences: number;
  clients: number;
  portalInvitations: number;
  contentTranslations: number;
};

export type LocaleReadiness = {
  canActivate: boolean;
  canArchive: boolean;
  canSetDefault: boolean;
  missingCriticalKeys: string[];
  archiveReferences: number;
};

const LOCALE_CODE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2}[0-9]?)?$/;
const BUILT_IN_LOCALES = new Set(["tr", "en"]);
export const ACTIVATION_CRITICAL_KEYS = [
  "common.error.title",
  "common.error.description",
  "common.actions.save",
  "common.actions.cancel",
  "auth.login.title",
  "auth.login.email",
  "auth.login.password",
  "auth.login.submit",
  "auth.messages.invalidCredentials",
  "navigation.items.dashboard",
  "navigation.items.settings",
  "navigation.account.signOut",
  "portal.dashboard.title",
  "portal.projects.title",
  "portal.tasks.title",
  "portal.revisions.title",
  "validation.required",
  "validation.invalidLocale",
] as const;

export class I18nService {
  private readonly repository;

  constructor(private readonly db: DomainDatabase) {
    this.repository = createI18nRepository(db);
  }

  listLocales(actor: DomainActor): LocaleRecord[] {
    requireOwnerScope(actor);
    this.ensureBootstrap();
    return this.repository.listLocales().map(toLocaleRecord);
  }

  getSettings(actor: DomainActor): I18nSettingsRecord {
    requireOwnerScope(actor);
    this.ensureBootstrap();
    return toSettingsRecord(this.repository.getSettings());
  }

  createLocale(actor: DomainActor, input: CreateLocaleInput): LocaleRecord {
    requireOwnerScope(actor);
    this.ensureBootstrap();

    const code = normalizeLocaleCode(input.code);
    if (BUILT_IN_LOCALES.has(code)) {
      throw new DomainError("CONFLICT", "Built-in dil zaten mevcut.");
    }
    if (this.repository.getLocale(code)) {
      throw new DomainError("CONFLICT", "Bu dil zaten eklenmiş.");
    }

    const fallbackLocale = normalizeOptionalLocale(input.fallbackLocale ?? "en");
    this.assertValidFallback(code, fallbackLocale);

    const created = this.repository.createLocale({
      code,
      name: normalizeRequiredText(input.name, "Dil adı zorunludur."),
      nativeName: normalizeRequiredText(input.nativeName ?? input.name, "Yerel dil adı zorunludur."),
      fallbackLocale,
      textDirection: input.textDirection ?? "ltr",
      status: "draft",
      builtIn: false,
      sortOrder: input.sortOrder ?? 100,
    });

    return toLocaleRecord(created);
  }

  updateLocale(actor: DomainActor, code: string, input: UpdateLocaleInput): LocaleRecord {
    requireOwnerScope(actor);
    this.ensureBootstrap();

    const locale = this.getExistingLocale(code);
    if (locale.builtIn && input.status === "archived") {
      throw new DomainError("CONFLICT", "Built-in diller arşivlenemez.");
    }

    const nextFallback = input.fallbackLocale === undefined
      ? locale.fallbackLocale
      : normalizeOptionalLocale(input.fallbackLocale);
    this.assertValidFallback(locale.code, nextFallback);

    const nextStatus = input.status ?? locale.status;
    if (
      nextStatus === "active"
      && locale.status !== "active"
      && !locale.builtIn
    ) {
      this.assertLocaleCanBeActivated(locale.code);
    }
    if (nextStatus === "archived") {
      this.assertLocaleCanBeArchived(locale.code);
    }

    const updated = this.repository.updateLocale(locale.code, {
      name: input.name === undefined ? undefined : normalizeRequiredText(input.name, "Dil adı zorunludur."),
      nativeName: input.nativeName === undefined
        ? undefined
        : normalizeRequiredText(input.nativeName, "Yerel dil adı zorunludur."),
      fallbackLocale: nextFallback,
      textDirection: input.textDirection,
      status: nextStatus,
      sortOrder: input.sortOrder,
    });

    if (!updated) throw notFound("Dil");
    return toLocaleRecord(updated);
  }

  archiveLocale(actor: DomainActor, code: string): LocaleRecord {
    return this.updateLocale(actor, code, { status: "archived" });
  }

  setDefaultLocale(actor: DomainActor, code: string): I18nSettingsRecord {
    requireOwnerScope(actor);
    this.ensureBootstrap();

    const locale = this.getExistingLocale(code);
    if (locale.status !== "active") {
      throw new DomainError("VALIDATION_ERROR", "Varsayılan dil yalnızca aktif bir dil olabilir.");
    }

    const updated = this.repository.updateDefaultLocale(locale.code);
    return toSettingsRecord(updated);
  }

  upsertUiTranslation(actor: DomainActor, input: UpsertUiTranslationInput): void {
    requireOwnerScope(actor);
    this.ensureBootstrap();

    const locale = this.getExistingLocale(input.locale);
    if (locale.status === "archived") {
      throw new DomainError("VALIDATION_ERROR", "Arşivlenmiş dile çeviri yazılamaz.");
    }

    const namespace = normalizeIdentifier(input.namespace, "Namespace geçersiz.", 64);
    const translationKey = normalizeIdentifier(input.key, "Çeviri anahtarı geçersiz.", 160);
    const value = input.value.trim();
    if (!value) {
      throw new DomainError("VALIDATION_ERROR", "Çeviri metni boş olamaz.");
    }

    this.repository.upsertUiTranslation({
      locale: locale.code,
      namespace,
      translationKey,
      value,
    });
    this.repository.bumpCatalogVersion();
  }

  resetUiTranslation(actor: DomainActor, input: Omit<UpsertUiTranslationInput, "value">): void {
    requireOwnerScope(actor);
    this.ensureBootstrap();

    const locale = this.getExistingLocale(input.locale);
    this.repository.deleteUiTranslation(
      locale.code,
      normalizeIdentifier(input.namespace, "Namespace geçersiz.", 64),
      normalizeIdentifier(input.key, "Çeviri anahtarı geçersiz.", 160),
    );
    this.repository.bumpCatalogVersion();
  }

  listUiTranslations(actor: DomainActor): UiTranslationRow[] {
    requireOwnerScope(actor);
    this.ensureBootstrap();
    return this.repository.listAllUiTranslations().map((row) => ({
      locale: row.locale,
      namespace: row.namespace,
      key: row.translationKey,
      value: row.value,
    }));
  }

  getCompletion(actor: DomainActor): TranslationCompletion[] {
    requireOwnerScope(actor);
    this.ensureBootstrap();

    const referenceKeys = Object.keys(flattenCatalog(trCatalog, I18N_NAMESPACES));
    const overrideRows = this.repository.listAllUiTranslations();
    const overrideKeysByLocale = new Map<string, Set<string>>();
    for (const row of overrideRows) {
      const keys = overrideKeysByLocale.get(row.locale) ?? new Set<string>();
      keys.add(`${row.namespace}.${row.translationKey}`);
      overrideKeysByLocale.set(row.locale, keys);
    }

    return this.repository.listLocales().map((locale) => {
      const builtIn = getBuiltInCatalog(locale.code);
      const builtInKeys = builtIn ? new Set(Object.keys(flattenCatalog(builtIn, I18N_NAMESPACES))) : new Set<string>();
      const overrideKeys = overrideKeysByLocale.get(locale.code) ?? new Set<string>();
      const missingKeys = referenceKeys.filter((key) => !builtInKeys.has(key) && !overrideKeys.has(key));
      const translated = referenceKeys.length - missingKeys.length;
      return {
        locale: locale.code,
        translated,
        total: referenceKeys.length,
        percent: referenceKeys.length ? Math.round((translated / referenceKeys.length) * 100) : 100,
        missingKeys,
      };
    });
  }

  getNamespaceCompletion(actor: DomainActor, code: string): NamespaceCompletion[] {
    requireOwnerScope(actor);
    this.ensureBootstrap();
    const locale = this.getExistingLocale(code);
    const translations = this.translationKeysForLocale(locale.code);

    return I18N_NAMESPACES.map((namespace) => {
      const referenceKeys = Object.keys(flattenCatalog(trCatalog, [namespace]));
      const missingKeys = referenceKeys.filter((key) => !translations.has(key));
      const translated = referenceKeys.length - missingKeys.length;
      return {
        namespace,
        translated,
        total: referenceKeys.length,
        percent: referenceKeys.length
          ? Math.round((translated / referenceKeys.length) * 100)
          : 100,
        missingKeys,
      };
    });
  }

  getLocaleUsage(actor: DomainActor, code: string): LocaleUsage {
    requireOwnerScope(actor);
    this.ensureBootstrap();
    const locale = this.getExistingLocale(code);
    return this.repository.countLocaleReferences(locale.code);
  }

  getLocaleReadiness(actor: DomainActor, code: string): LocaleReadiness {
    requireOwnerScope(actor);
    this.ensureBootstrap();
    const locale = this.getExistingLocale(code);
    const settings = this.getSettings(actor);
    const usage = this.getLocaleUsage(actor, locale.code);
    const archiveReferences = Object.entries(usage)
      .filter(([key]) => key !== "contentTranslations")
      .reduce((total, [, value]) => total + value, 0);
    const missingCriticalKeys = locale.builtIn
      ? []
      : ACTIVATION_CRITICAL_KEYS.filter(
        (key) => !this.translationKeysForLocale(locale.code).has(key),
      );

    return {
      canActivate: locale.status === "active" || missingCriticalKeys.length === 0,
      canArchive: !locale.builtIn
        && settings.defaultLocale !== locale.code
        && archiveReferences === 0,
      canSetDefault: locale.status === "active",
      missingCriticalKeys,
      archiveReferences,
    };
  }

  exportPackage(actor: DomainActor): I18nExportPackage {
    requireOwnerScope(actor);
    this.ensureBootstrap();

    return {
      format: "neta-i18n",
      version: 1,
      exportedAt: new Date().toISOString(),
      defaultLocale: this.getSettings(actor).defaultLocale,
      locales: this.listLocales(actor),
      translations: this.listUiTranslations(actor),
    };
  }

  importPackage(actor: DomainActor, input: unknown): I18nExportPackage {
    requireOwnerScope(actor);
    this.ensureBootstrap();

    const parsed = parseImportPackage(input);
    for (const locale of parsed.locales) {
      if (!this.repository.getLocale(locale.code) && !BUILT_IN_LOCALES.has(locale.code)) {
        this.createLocale(actor, {
          code: locale.code,
          name: locale.name,
          nativeName: locale.nativeName,
          fallbackLocale: locale.fallbackLocale ?? DEFAULT_LOCALE,
          textDirection: locale.textDirection,
          status: locale.status === "archived" ? "draft" : locale.status,
          sortOrder: locale.sortOrder,
        });
      }
    }

    for (const translation of parsed.translations) {
      this.upsertUiTranslation(actor, translation);
    }

    const defaultLocale = parsed.defaultLocale ? this.repository.getLocale(parsed.defaultLocale) : null;
    if (defaultLocale?.status === "active") {
      this.setDefaultLocale(actor, defaultLocale.code);
    }

    return this.exportPackage(actor);
  }

  private ensureBootstrap(): void {
    this.repository.createSettingsIfMissing();
    ensureBuiltInLocale(this.repository, {
      code: "tr",
      name: "Turkish",
      nativeName: "Türkçe",
      status: "active",
      fallbackLocale: null,
      textDirection: "ltr",
      builtIn: true,
      sortOrder: 10,
    });
    ensureBuiltInLocale(this.repository, {
      code: "en",
      name: "English",
      nativeName: "English",
      status: "active",
      fallbackLocale: "tr",
      textDirection: "ltr",
      builtIn: true,
      sortOrder: 20,
    });
  }

  private getExistingLocale(code: string) {
    const normalized = normalizeLocaleCode(code);
    const locale = this.repository.getLocale(normalized);
    if (!locale) throw notFound("Dil");
    return locale;
  }

  private assertValidFallback(code: string, fallbackLocale: string | null): void {
    if (!fallbackLocale) return;
    if (fallbackLocale === code) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Dil kendi kendine fallback olamaz.",
        { reason: "self_fallback" },
      );
    }

    const fallback = this.repository.getLocale(fallbackLocale);
    if (!fallback || fallback.status === "archived") {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Fallback dili aktif veya taslak bir dil olmalıdır.",
        { reason: "invalid_fallback" },
      );
    }

    const graph = new Map(
      this.repository
        .listLocales()
        .map((locale) => [locale.code, locale.fallbackLocale] as const),
    );
    graph.set(code, fallbackLocale);

    const seen = new Set<string>();
    let cursor: string | null = fallbackLocale;
    while (cursor) {
      if (cursor === code || seen.has(cursor)) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Fallback zinciri döngü oluşturamaz.",
          { reason: "fallback_loop" },
        );
      }
      seen.add(cursor);
      cursor = graph.get(cursor) ?? null;
    }
  }

  private assertLocaleCanBeArchived(code: string): void {
    const references = this.repository.countLocaleReferences(code);
    const referenceCount = Object.entries(references)
      .filter(([key]) => key !== "contentTranslations")
      .reduce((total, [, value]) => total + value, 0);
    if (referenceCount > 0) {
      throw new DomainError("CONFLICT", "Kullanımda olan dil arşivlenemez.", references);
    }
  }

  private assertLocaleCanBeActivated(code: string): void {
    const locale = this.getExistingLocale(code);
    if (locale.builtIn) return;
    const translatedKeys = this.translationKeysForLocale(locale.code);
    const missingCriticalKeys = ACTIVATION_CRITICAL_KEYS.filter(
      (key) => !translatedKeys.has(key),
    );
    if (missingCriticalKeys.length > 0) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Kritik arayüz çevirileri tamamlanmadan dil aktifleştirilemez.",
        { missingCriticalKeys },
      );
    }
  }

  private translationKeysForLocale(code: string): Set<string> {
    const builtIn = getBuiltInCatalog(code);
    const keys = builtIn
      ? Object.keys(flattenCatalog(builtIn, I18N_NAMESPACES))
      : [];
    for (const row of this.repository.listAllUiTranslations()) {
      if (row.locale === code && row.value.trim()) {
        keys.push(`${row.namespace}.${row.translationKey}`);
      }
    }
    return new Set(keys);
  }
}

export function getReferenceTranslationKeys(namespace: I18nNamespace | "all" = "all") {
  const namespaces = namespace === "all" ? I18N_NAMESPACES : [namespace];
  const tr = flattenCatalog(trCatalog, namespaces);
  const en = flattenCatalog(getBuiltInCatalog("en") ?? trCatalog, namespaces);
  const parity = compareCatalogKeys(trCatalog, getBuiltInCatalog("en") ?? trCatalog, I18N_NAMESPACES);
  return Object.keys(tr).sort().map((key) => ({
    key,
    namespace: key.split(".")[0] as I18nNamespace,
    translationKey: key.split(".").slice(1).join("."),
    tr: tr[key] ?? "",
    en: en[key] ?? "",
    parityOk: parity.missingInLeft.length === 0 && parity.missingInRight.length === 0,
  }));
}

function ensureBuiltInLocale(
  repository: ReturnType<typeof createI18nRepository>,
  value: Parameters<ReturnType<typeof createI18nRepository>["createLocale"]>[0],
): void {
  const existing = repository.getLocale(value.code);
  if (!existing) {
    repository.createLocale(value);
    return;
  }

  repository.updateLocale(value.code, {
    name: value.name,
    nativeName: value.nativeName,
    status: value.status,
    fallbackLocale: value.fallbackLocale,
    textDirection: value.textDirection,
    builtIn: true,
    sortOrder: value.sortOrder,
  });
}

function normalizeLocaleCode(code: string): string {
  const normalized = code.trim();
  if (!LOCALE_CODE_PATTERN.test(normalized)) {
    throw new DomainError("VALIDATION_ERROR", "Dil kodu BCP47 kısa formatında olmalıdır. Örn: tr, en, fr veya ar-XB.");
  }
  return normalized;
}

function normalizeOptionalLocale(code: string | null | undefined): string | null {
  if (!code) return null;
  return normalizeLocaleCode(code);
}

function normalizeRequiredText(value: string, message: string): string {
  const normalized = value.trim();
  if (!normalized) throw new DomainError("VALIDATION_ERROR", message);
  if (normalized.length > 80) {
    throw new DomainError("VALIDATION_ERROR", "Dil adı 80 karakterden kısa olmalıdır.");
  }
  return normalized;
}

function normalizeIdentifier(value: string, message: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || !/^[a-zA-Z0-9_.-]+$/.test(normalized)) {
    throw new DomainError("VALIDATION_ERROR", message);
  }
  return normalized;
}

function toLocaleRecord(value: {
  code: string;
  name: string;
  nativeName: string;
  status: LocaleStatus;
  fallbackLocale: string | null;
  textDirection: TextDirection;
  builtIn: boolean;
  sortOrder: number;
}): LocaleRecord {
  return {
    code: value.code,
    name: value.name,
    nativeName: value.nativeName,
    status: value.status,
    fallbackLocale: value.fallbackLocale,
    textDirection: value.textDirection,
    builtIn: value.builtIn,
    sortOrder: value.sortOrder,
  };
}

function toSettingsRecord(value: {
  defaultLocale: string;
  catalogVersion: number;
} | undefined): I18nSettingsRecord {
  if (!value) {
    throw new DomainError("INVARIANT_VIOLATION", "I18n ayarları oluşturulamadı.");
  }
  return {
    defaultLocale: value.defaultLocale,
    catalogVersion: value.catalogVersion,
  };
}

function parseImportPackage(input: unknown): I18nExportPackage {
  if (!input || typeof input !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Import paketi geçersiz.");
  }
  const value = input as Partial<I18nExportPackage>;
  if (value.format !== "neta-i18n" || value.version !== 1) {
    throw new DomainError("VALIDATION_ERROR", "Import paketi desteklenmiyor.");
  }
  if (!Array.isArray(value.locales) || !Array.isArray(value.translations)) {
    throw new DomainError("VALIDATION_ERROR", "Import paketinde locale veya çeviri listesi eksik.");
  }

  return {
    format: "neta-i18n",
    version: 1,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    defaultLocale: typeof value.defaultLocale === "string" ? value.defaultLocale : DEFAULT_LOCALE,
    locales: value.locales.map((locale) => ({
      code: normalizeLocaleCode(locale.code),
      name: normalizeRequiredText(locale.name, "Dil adı zorunludur."),
      nativeName: normalizeRequiredText(locale.nativeName, "Yerel dil adı zorunludur."),
      status: locale.status,
      fallbackLocale: normalizeOptionalLocale(locale.fallbackLocale),
      textDirection: locale.textDirection === "rtl" ? "rtl" : "ltr",
      builtIn: Boolean(locale.builtIn),
      sortOrder: Number.isFinite(locale.sortOrder) ? locale.sortOrder : 100,
    })),
    translations: value.translations.map((translation) => ({
      locale: normalizeLocaleCode(translation.locale),
      namespace: normalizeIdentifier(translation.namespace, "Namespace geçersiz.", 64),
      key: normalizeIdentifier(translation.key, "Çeviri anahtarı geçersiz.", 160),
      value: normalizeRequiredText(translation.value, "Çeviri metni boş olamaz."),
    })),
  };
}
