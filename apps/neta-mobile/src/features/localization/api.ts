import {
  createIdempotencyKey,
  isLocaleDefinition,
  isTranslationCatalog,
  type LocaleDefinition,
  type LocaleMutationPayload,
  type TranslationCatalog,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

export function listLocales(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<LocaleDefinition[]>> { return requestResource(instance, user, { cachePolicy: 'short', parser: parseLocales, path: 'settings/locales', resource: 'localization' }); }
export function createLocale(instance: StoredInstance, user: MeProfile, code: string, payload: LocaleMutationPayload): Promise<ResourceResult<LocaleDefinition>> { return requestResource(instance, user, { body: { code, ...payload }, idempotencyKey: createIdempotencyKey('locale-create'), method: 'POST', parser: parseLocale, path: 'settings/locales', resource: 'localization' }); }
export function updateLocale(instance: StoredInstance, user: MeProfile, code: string, payload: LocaleMutationPayload): Promise<ResourceResult<LocaleDefinition>> { return requestResource(instance, user, { body: payload, method: 'PATCH', parser: parseLocale, path: `settings/locales/${encodeURIComponent(code)}`, resource: 'localization' }); }
export function getTranslations(instance: StoredInstance, user: MeProfile, code: string): Promise<ResourceResult<TranslationCatalog>> { return requestResource(instance, user, { cachePolicy: 'long', filters: { code, version: instance.catalogVersion }, parser: parseCatalog, path: `settings/locales/${encodeURIComponent(code)}/translations`, resource: 'localization' }); }
export function updateTranslations(instance: StoredInstance, user: MeProfile, code: string, catalog: TranslationCatalog): Promise<ResourceResult<TranslationCatalog>> { return requestResource(instance, user, { body: { messages: catalog.messages, version: catalog.version }, method: 'PUT', parser: parseCatalog, path: `settings/locales/${encodeURIComponent(code)}/translations`, resource: 'localization' }); }
export function importTranslations(instance: StoredInstance, user: MeProfile, catalog: TranslationCatalog): Promise<ResourceResult<TranslationCatalog>> { return requestResource(instance, user, { body: catalog, idempotencyKey: createIdempotencyKey('locale-import'), method: 'POST', parser: parseCatalog, path: 'settings/locales/import', resource: 'localization' }); }
export function exportTranslations(instance: StoredInstance, user: MeProfile, code: string): Promise<ResourceResult<TranslationCatalog>> { return requestResource(instance, user, { parser: parseCatalog, path: `settings/locales/export?${new URLSearchParams({ locale: code }).toString()}`, resource: 'localization' }); }
export function getRuntimeCatalog(instance: StoredInstance, user: MeProfile, locale: string): Promise<ResourceResult<TranslationCatalog>> { return requestResource(instance, user, { cachePolicy: 'long', filters: { locale, version: instance.catalogVersion }, parser: parseCatalog, path: `localization/catalog?${new URLSearchParams({ locale }).toString()}`, resource: 'localization' }); }

function parseLocales(value: unknown): LocaleDefinition[] { if (!Array.isArray(value) || !value.every(isLocaleDefinition)) throw contractError('Locale list'); return value; }
function parseLocale(value: unknown): LocaleDefinition { if (!isLocaleDefinition(value)) throw contractError('Locale'); return value; }
function parseCatalog(value: unknown): TranslationCatalog { if (!isTranslationCatalog(value)) throw contractError('Translation catalog'); return value; }
function contractError(name: string): NetaClientError { return new NetaClientError('SERVER_ERROR', `${name} API kontratı beklenen formatta değil.`); }
