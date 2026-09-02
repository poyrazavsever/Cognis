import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CachePolicy, ResourceName } from '@neta/api-contracts';

import { type QueryKey, serializeQueryKey } from './query-key';

const CACHE_PREFIX = 'neta.cache.v2.';
const LEGACY_CACHE_PREFIX = 'neta.cache.';

const POLICY_TTL_MS: Record<Exclude<CachePolicy, 'none'>, number> = {
  long: 24 * 60 * 60 * 1000,
  medium: 5 * 60 * 1000,
  short: 30 * 1000,
};

type CacheRecord<T> = {
  storedAt: number;
  value: T;
};

export type CacheHit<T> = CacheRecord<T> & { isStale: boolean };

export async function readResourceCache<T>(
  key: QueryKey,
  policy: CachePolicy,
  allowExpired = false,
): Promise<CacheHit<T> | null> {
  if (policy === 'none') {
    return null;
  }

  const raw = await AsyncStorage.getItem(createCacheKey(key));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CacheRecord<T>;

    const isStale = Date.now() - parsed.storedAt > POLICY_TTL_MS[policy];
    if (isStale && !allowExpired) {
      return null;
    }
    return { ...parsed, isStale };
  } catch {
    await AsyncStorage.removeItem(createCacheKey(key));
    return null;
  }
}

export async function writeResourceCache<T>(
  key: QueryKey,
  policy: CachePolicy,
  value: T,
): Promise<void> {
  if (policy === 'none') {
    return;
  }

  await AsyncStorage.setItem(
    createCacheKey(key),
    JSON.stringify({
      storedAt: Date.now(),
      value,
    } satisfies CacheRecord<T>),
  );
}

export async function clearResourceCacheForInstance(instanceId: string): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const prefix = `${CACHE_PREFIX}${encodeURIComponent(instanceId)}`;
  const legacyPrefix = `${LEGACY_CACHE_PREFIX}${encodeURIComponent(instanceId)}`;
  const matchingKeys = keys.filter((key) => key.startsWith(prefix) || key.startsWith(legacyPrefix));

  if (matchingKeys.length > 0) {
    await AsyncStorage.multiRemove(matchingKeys);
  }
}

export async function purgeLegacyResourceCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const legacyKeys = keys.filter((key) => key.startsWith(LEGACY_CACHE_PREFIX) && !key.startsWith(CACHE_PREFIX));
  if (legacyKeys.length > 0) await AsyncStorage.multiRemove(legacyKeys);
}

export async function clearResourceCacheForResource(
  instanceId: string,
  resource: ResourceName,
): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const prefix = `${CACHE_PREFIX}${encodeURIComponent(instanceId)}.`;
  const matchingKeys = keys.filter((key) => {
    if (!key.startsWith(prefix)) {
      return false;
    }

    try {
      const queryKey = JSON.parse(decodeURIComponent(key.slice(prefix.length))) as unknown;
      return Array.isArray(queryKey) && queryKey[4] === resource;
    } catch {
      return false;
    }
  });

  if (matchingKeys.length > 0) {
    await AsyncStorage.multiRemove(matchingKeys);
  }
}

function createCacheKey(key: QueryKey): string {
  return `${CACHE_PREFIX}${encodeURIComponent(key[0])}.${encodeURIComponent(serializeQueryKey(key))}`;
}
