import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import type { CachePolicy, RequestMetadata, ResourceName } from '@neta/api-contracts';

import { NetaClientError, toClientError } from '@/lib/api/errors';
import { createApiUrl, fetchJson } from '@/lib/api/http';
import { getNativeAuthHeaders } from '@/lib/auth/native-auth-client';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { recordPerformanceSample } from '@/lib/performance/metrics';

import { createQueryKey, type QueryFilters, type QueryKey } from './query-key';
import { effectiveCachePolicy } from './cache-policy';
import {
  clearResourceCacheForResource,
  readResourceCache,
  writeResourceCache,
} from './resource-cache';

type ResourceRequestOptions<T> = {
  body?: unknown;
  cachePolicy?: CachePolicy;
  filters?: QueryFilters;
  idempotencyKey?: string;
  invalidates?: ResourceName[];
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  parser: (value: unknown) => T;
  path: string;
  resource: ResourceName;
};

export type ResourceResult<T> = {
  data: T;
  cachedAt: number | null;
  fromCache: boolean;
  isStale: boolean;
  queryKey: QueryKey;
  requestDurationMs: number | null;
};

export async function requestResource<T>(
  instance: StoredInstance,
  user: MeProfile,
  options: ResourceRequestOptions<T>,
): Promise<ResourceResult<T>> {
  const locale = user.preferences?.locale ?? instance.defaultLocale;
  const cachePolicy = effectiveCachePolicy(options.resource, options.cachePolicy ?? 'none');
  const queryKey = createQueryKey(instance.instanceId, user.id, user.role, locale, options.resource, options.filters);
  const cached = await readResourceCache<T>(queryKey, cachePolicy);

  if (cached) {
    try {
      return { data: options.parser(cached.value), cachedAt: cached.storedAt, fromCache: true, isStale: false, queryKey, requestDurationMs: null };
    } catch {
      await clearResourceCacheForResource(instance.instanceId, options.resource);
    }
  }

  const startedAt = Date.now();
  const authHeaders = await getNativeAuthHeaders(instance);
  const requestOptions: RequestInit = {
    headers: createRequestHeaders(
      createRequestMetadata(user, locale, options.idempotencyKey),
      options.body !== undefined,
      authHeaders,
    ),
    credentials: 'include',
    method: options.method ?? 'GET',
  };

  if (options.body !== undefined) {
    requestOptions.body = JSON.stringify(options.body);
  }

  if (requestOptions.method !== 'GET') {
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false) throw new NetaClientError('NETWORK_ERROR', 'Çevrimdışıyken değişiklik yapılamaz.');
  }

  let data: unknown;
  try {
    ({ data } = await fetchJson<unknown>(createApiUrl(instance.apiBaseUrl, options.path), {
      ...requestOptions,
      missingEndpointMessage:
        'Bu Neta sunucusu bu ekran için gereken mobil API endpoint’ini henüz sunmuyor.',
    }));
  } catch (value) {
    const error = toClientError(value);
    if (requestOptions.method === 'GET' && (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT')) {
      const stale = await readResourceCache<T>(queryKey, cachePolicy, true);
      if (stale) return { cachedAt: stale.storedAt, data: options.parser(stale.value), fromCache: true, isStale: true, queryKey, requestDurationMs: Date.now() - startedAt };
    }
    throw error;
  }
  const parsed = options.parser(data);
  if (options.resource === 'dashboard') recordPerformanceSample('dashboard-data', Date.now() - startedAt);

  if (requestOptions.method !== 'GET') {
    const invalidatedResources = new Set(options.invalidates ?? [options.resource]);
    await Promise.all(
      [...invalidatedResources].map((resource) =>
        clearResourceCacheForResource(instance.instanceId, resource),
      ),
    );
  }

  await writeResourceCache(queryKey, cachePolicy, parsed);

  return {
    data: parsed,
    cachedAt: null,
    fromCache: false,
    isStale: false,
    queryKey,
    requestDurationMs: Date.now() - startedAt,
  };
}

function createRequestMetadata(
  user: MeProfile,
  locale: string,
  idempotencyKey?: string,
): RequestMetadata {
  const metadata: RequestMetadata = {
    client: 'mobile',
    locale,
    platform: Platform.OS,
    role: user.role,
    version: Constants.expoConfig?.version ?? '0.0.0',
  };

  if (idempotencyKey) {
    metadata.idempotencyKey = idempotencyKey;
  }

  return metadata;
}

function createRequestHeaders(metadata: RequestMetadata, hasBody: boolean, authHeaders: Record<string, string>): Record<string, string> {
  const headers = {
    'Accept-Language': metadata.locale,
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    'X-Neta-Client': metadata.client,
    'X-Neta-Client-Version': metadata.version,
    'X-Neta-Platform': metadata.platform,
    ...authHeaders,
  };

  return metadata.idempotencyKey
    ? { ...headers, 'Idempotency-Key': metadata.idempotencyKey }
    : headers;
}
