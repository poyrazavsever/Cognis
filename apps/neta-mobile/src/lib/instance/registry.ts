import AsyncStorage from '@react-native-async-storage/async-storage';

import { secureStorage } from '@/lib/storage/secure-storage';

import type { PublicCatalog, StoredInstance } from './types';

const ACTIVE_INSTANCE_KEY = 'neta.instance.active';
const INSTANCE_PREFIX = 'neta.instance.';
const CATALOG_NAME = 'public-catalog';

export type SaveInstanceResult = {
  instanceIdChanged: boolean;
};

export async function getActiveInstance(): Promise<StoredInstance | null> {
  const instanceId = await AsyncStorage.getItem(ACTIVE_INSTANCE_KEY);

  if (!instanceId) {
    return null;
  }

  return getStoredInstance(instanceId);
}

export async function getStoredInstance(instanceId: string): Promise<StoredInstance | null> {
  const raw = await AsyncStorage.getItem(createInstanceKey(instanceId));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredInstance;
  } catch {
    await AsyncStorage.removeItem(createInstanceKey(instanceId));
    return null;
  }
}

export async function updateStoredInstance(instance: StoredInstance): Promise<void> {
  await AsyncStorage.setItem(createInstanceKey(instance.instanceId), JSON.stringify(instance));
}

export async function saveDiscoveredInstance(
  instance: StoredInstance,
  catalog: PublicCatalog | null,
): Promise<SaveInstanceResult> {
  const previous = await getActiveInstance();
  const instanceIdChanged = Boolean(previous && previous.origin === instance.origin && previous.instanceId !== instance.instanceId);

  if (instanceIdChanged && previous) {
    await clearInstanceSession(previous.instanceId);
  }

  await AsyncStorage.setItem(createInstanceKey(instance.instanceId), JSON.stringify(instance));
  await AsyncStorage.setItem(ACTIVE_INSTANCE_KEY, instance.instanceId);

  if (catalog) {
    await AsyncStorage.setItem(createCatalogKey(instance.instanceId), JSON.stringify(catalog));
  }

  return { instanceIdChanged };
}

export async function clearActiveInstance(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_INSTANCE_KEY);
}

export async function clearInstanceSession(instanceId: string): Promise<void> {
  await Promise.all([
    secureStorage.remove(instanceId, 'auth.session'),
    secureStorage.remove(instanceId, 'auth.cookie'),
    secureStorage.remove(instanceId, 'auth.bearer'),
    secureStorage.remove(instanceId, 'auth.csrf'),
    secureStorage.remove(instanceId, 'auth.user'),
  ]);
}

export function createInstanceKey(instanceId: string): string {
  return `${INSTANCE_PREFIX}${encodeURIComponent(instanceId)}`;
}

function createCatalogKey(instanceId: string): string {
  return `${createInstanceKey(instanceId)}.${CATALOG_NAME}`;
}
