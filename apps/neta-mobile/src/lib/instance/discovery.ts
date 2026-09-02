import Constants from 'expo-constants';

import { appEnvironment } from '@/config/environment';
import { NetaClientError } from '@/lib/api/errors';
import { fetchJson, unwrapEnvelope } from '@/lib/api/http';
import { normalizeHex } from '@/theme/tokens';

import { isSameTrustedOrigin, normalizeNetaOrigin } from './domain';
import type { DiscoveryResult, PublicCatalog, StoredInstance } from './types';
import { compareSemver, isSupportedApiVersion } from './version';

const SUPPORTED_DISCOVERY_VERSION = 1;
const DEFAULT_API_VERSION = 'v1';
const DEFAULT_CATALOG_VERSION = 0;

export type DiscoveryStep =
  | 'idle'
  | 'normalizing'
  | 'discovering'
  | 'validating-discovery'
  | 'checking-health'
  | 'loading-meta'
  | 'loading-public-catalog'
  | 'ready-for-auth';

type DiscoverOptions = {
  onStep?: (step: DiscoveryStep) => void;
};

type DiscoveryDocument = {
  protocol?: unknown;
  discoveryVersion?: unknown;
  instanceId?: unknown;
  api?: Record<string, unknown>;
  links?: Record<string, unknown>;
  capabilities?: unknown;
  defaultLocale?: unknown;
  enabledLocales?: unknown;
  localization?: {
    defaultLocale?: unknown;
    supportedLocales?: unknown;
  };
};

type MetaDocument = {
  protocol?: {
    apiVersion?: unknown;
  };
  instance?: {
    id?: unknown;
    apiVersion?: unknown;
    workspaceName?: unknown;
  };
  workspace?: {
    name?: unknown;
  };
  branding?: {
    primaryColor?: unknown;
    accentColor?: unknown;
    lightLogoUrl?: unknown;
    darkLogoUrl?: unknown;
    faviconUrl?: unknown;
    defaultColorMode?: unknown;
  };
  localization?: {
    defaultLocale?: unknown;
    enabledLocales?: unknown;
    supportedLocales?: unknown;
    catalogVersion?: unknown;
  };
  client?: {
    minimumSupportedVersion?: unknown;
  };
  minimumSupportedVersion?: unknown;
  capabilities?: unknown;
  defaultColorMode?: unknown;
};

export async function discoverInstance(
  input: string,
  options: DiscoverOptions = {},
): Promise<DiscoveryResult> {
  options.onStep?.('normalizing');
  const normalized = normalizeNetaOrigin(input, { environment: appEnvironment });

  options.onStep?.('discovering');
  const discovery = await getDiscoveryDocument(normalized.origin);

  options.onStep?.('validating-discovery');
  validateDiscoveryDocument(discovery);
  const apiBaseUrl = resolveTrustedUrl(
    readString(discovery.api?.baseUrl) ?? readString(discovery.links?.apiBaseUrl) ?? '/api/v1',
    normalized.origin,
  );
  const healthUrl = resolveTrustedUrl(
    readString(discovery.api?.healthUrl) ?? readString(discovery.links?.health) ?? '/api/v1/health',
    normalized.origin,
  );
  const metaUrl = resolveTrustedUrl(
    readString(discovery.api?.metaUrl) ?? readString(discovery.links?.meta) ?? '/api/v1/meta',
    normalized.origin,
  );
  const catalogUrl = resolveTrustedUrl(
    readString(discovery.api?.catalogUrl) ??
      readString(discovery.links?.catalog) ??
      '/api/v1/localization/catalog',
    normalized.origin,
  );

  options.onStep?.('checking-health');
  await assertHealthy(healthUrl);

  options.onStep?.('loading-meta');
  const meta = await getMetaDocument(metaUrl);
  validateMetaDocument(discovery, meta);

  options.onStep?.('loading-public-catalog');
  const catalog = await getPublicCatalog(catalogUrl);
  const instance = createStoredInstance(normalized.origin, apiBaseUrl, discovery, meta, catalog);

  options.onStep?.('ready-for-auth');

  return { catalog, instance };
}

function validateDiscoveryDocument(discovery: DiscoveryDocument): asserts discovery is Required<
  Pick<DiscoveryDocument, 'protocol' | 'discoveryVersion' | 'instanceId'>
> &
  DiscoveryDocument {
  if (discovery.protocol !== 'neta') {
    throw new NetaClientError('NOT_NETA', 'Bu domain bir Neta instance gibi yanıt vermedi.');
  }

  if (discovery.discoveryVersion !== SUPPORTED_DISCOVERY_VERSION) {
    throw new NetaClientError('INVALID_DISCOVERY', 'Desteklenmeyen discovery versiyonu.');
  }

  if (typeof discovery.instanceId !== 'string' || !discovery.instanceId.trim()) {
    throw new NetaClientError('INVALID_DISCOVERY', 'Discovery instanceId döndürmedi.');
  }
}

function validateMetaDocument(discovery: DiscoveryDocument, meta: MetaDocument): void {
  const metaInstanceId = readString(meta.instance?.id);

  if (metaInstanceId && metaInstanceId !== discovery.instanceId) {
    throw new NetaClientError('INVALID_DISCOVERY', 'Discovery ve meta instance ID eşleşmiyor.');
  }

  const minimumVersion = readString(meta.client?.minimumSupportedVersion) ?? readString(meta.minimumSupportedVersion);
  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

  if (minimumVersion && compareSemver(currentVersion, minimumVersion) < 0) {
    throw new NetaClientError(
      'INCOMPATIBLE_CLIENT',
      `Bu instance Neta Mobile ${minimumVersion} veya üstünü istiyor.`,
    );
  }

  const apiVersion = readString(meta.protocol?.apiVersion) ?? readString(meta.instance?.apiVersion) ?? DEFAULT_API_VERSION;
  if (!isSupportedApiVersion(apiVersion)) {
    throw new NetaClientError('INCOMPATIBLE_CLIENT', `Bu instance desteklenmeyen ${apiVersion} API sürümünü kullanıyor.`);
  }

}

async function getDiscoveryDocument(origin: string): Promise<DiscoveryDocument> {
  const { data } = await fetchJson<unknown>(new URL('/.well-known/neta', origin).toString());

  return unwrapEnvelope<DiscoveryDocument>(data);
}

async function assertHealthy(healthUrl: string): Promise<void> {
  const { data } = await fetchJson<unknown>(healthUrl);
  const health = unwrapEnvelope<Record<string, unknown>>(data);
  const status = readString(health.status) ?? readString(health.readiness);

  if (status && !['ok', 'healthy', 'ready'].includes(status.toLowerCase())) {
    throw new NetaClientError('UNHEALTHY', 'Neta instance şu anda hazır değil.');
  }
}

async function getMetaDocument(metaUrl: string): Promise<MetaDocument> {
  const { data } = await fetchJson<unknown>(metaUrl);

  return unwrapEnvelope<MetaDocument>(data);
}

async function getPublicCatalog(catalogUrl: string): Promise<PublicCatalog | null> {
  try {
    const { data } = await fetchJson<unknown>(catalogUrl);
    const catalog = unwrapEnvelope<Record<string, unknown>>(data);
    const messages = catalog.messages;

    if (!isStringRecord(messages)) {
      return null;
    }

    return {
      locale: readString(catalog.locale) ?? 'tr',
      messages,
      version: readNumber(catalog.version) ?? DEFAULT_CATALOG_VERSION,
    };
  } catch (error) {
    if (error instanceof NetaClientError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function createStoredInstance(
  origin: string,
  apiBaseUrl: string,
  discovery: DiscoveryDocument & { discoveryVersion: unknown; instanceId: unknown },
  meta: MetaDocument,
  catalog: PublicCatalog | null,
): StoredInstance {
  const branding = meta.branding ?? {};
  const localization = meta.localization ?? {};
  const defaultLocale =
    readString(localization.defaultLocale) ??
    readString(discovery.localization?.defaultLocale) ??
    readString(discovery.defaultLocale) ??
    catalog?.locale ??
    'tr';
  const enabledLocales =
    readLocaleCodes(localization.supportedLocales) ??
    readStringArray(localization.enabledLocales) ??
    readLocaleCodes(discovery.localization?.supportedLocales) ??
    readStringArray(discovery.enabledLocales) ??
    [defaultLocale];

  return {
    accentColor: normalizeHex(readString(branding.accentColor)),
    apiBaseUrl,
    apiVersion: readString(meta.protocol?.apiVersion) ?? readString(meta.instance?.apiVersion) ?? DEFAULT_API_VERSION,
    catalogVersion: readNumber(localization.catalogVersion) ?? catalog?.version ?? DEFAULT_CATALOG_VERSION,
    capabilities: readStringArray(meta.capabilities) ?? readStringArray(discovery.capabilities) ?? [],
    darkLogoUrl: readNullableUrl(branding.darkLogoUrl, origin),
    defaultColorMode: readColorMode(branding.defaultColorMode ?? meta.defaultColorMode),
    defaultLocale,
    discoveryVersion: Number(discovery.discoveryVersion),
    enabledLocales,
    faviconUrl: readNullableUrl(branding.faviconUrl, origin),
    instanceId: String(discovery.instanceId),
    lastConnectedAt: new Date().toISOString(),
    lightLogoUrl: readNullableUrl(branding.lightLogoUrl, origin),
    origin,
    primaryColor: normalizeHex(readString(branding.primaryColor)),
    workspaceName:
      readString(meta.workspace?.name) ?? readString(meta.instance?.workspaceName) ?? new URL(origin).hostname,
  };
}

function resolveTrustedUrl(value: string, origin: string): string {
  const url = new URL(value, origin).toString();

  if (!isSameTrustedOrigin(url, origin)) {
    throw new NetaClientError('UNTRUSTED_ORIGIN', 'Discovery farklı origin’e işaret ediyor.');
  }

  return url;
}

function readNullableUrl(value: unknown, origin: string): string | null {
  const stringValue = readString(value);

  if (!stringValue) {
    return null;
  }

  return resolveTrustedUrl(stringValue, origin);
}

function readColorMode(value: unknown): StoredInstance['defaultColorMode'] {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const strings = value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  );

  return strings.length > 0 ? strings : null;
}

function readLocaleCodes(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const codes = value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const locale = item as Record<string, unknown>;
    if (locale.status !== undefined && locale.status !== 'active') return [];
    const code = readString(locale.code);
    return code ? [code] : [];
  });

  return codes.length > 0 ? [...new Set(codes)] : null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}
