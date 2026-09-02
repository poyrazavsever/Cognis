import AsyncStorage from '@react-native-async-storage/async-storage';

import { createInstanceStorageKey } from './storage-key';

export const publicStorage = {
  get(instanceId: string, name: string): Promise<string | null> {
    return AsyncStorage.getItem(createInstanceStorageKey(instanceId, name));
  },

  set(instanceId: string, name: string, value: string): Promise<void> {
    return AsyncStorage.setItem(createInstanceStorageKey(instanceId, name), value);
  },

  remove(instanceId: string, name: string): Promise<void> {
    return AsyncStorage.removeItem(createInstanceStorageKey(instanceId, name));
  },
};
