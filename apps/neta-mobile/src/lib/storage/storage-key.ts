const STORAGE_PREFIX = 'neta';

function toHex(value: string): string {
  return Array.from(new TextEncoder().encode(value), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export function createInstanceStorageKey(instanceId: string, name: string): string {
  const normalizedInstanceId = instanceId.trim();
  const normalizedName = name.trim();

  if (!normalizedInstanceId || !normalizedName) {
    throw new Error('Instance ID and storage name are required.');
  }

  if (!/^[A-Za-z0-9._-]+$/.test(normalizedName)) {
    throw new Error('Storage name contains unsupported characters.');
  }

  return `${STORAGE_PREFIX}.${toHex(normalizedInstanceId)}.${normalizedName}`;
}
