import * as SecureStore from 'expo-secure-store';

import { createInstanceStorageKey } from './storage-key';

export const secureStorage = {
  get(instanceId: string, name: string): Promise<string | null> {
    return SecureStore.getItemAsync(createInstanceStorageKey(instanceId, name));
  },

  set(instanceId: string, name: string, value: string): Promise<void> {
    return SecureStore.setItemAsync(createInstanceStorageKey(instanceId, name), value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  remove(instanceId: string, name: string): Promise<void> {
    return SecureStore.deleteItemAsync(createInstanceStorageKey(instanceId, name));
  },
};
