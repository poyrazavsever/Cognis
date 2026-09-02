import type { ResourceName } from '@neta/api-contracts';

import type { SessionRole } from '@/lib/instance/types';

export type QueryFilters = Record<string, string | number | boolean | null | undefined>;

export type QueryKey = readonly [
  instanceId: string,
  userId: string,
  role: SessionRole,
  locale: string,
  resource: ResourceName,
  filters: QueryFilters,
];

export function createQueryKey(
  instanceId: string,
  userId: string,
  role: SessionRole,
  locale: string,
  resource: ResourceName,
  filters: QueryFilters = {},
): QueryKey {
  return [instanceId, userId, role, locale, resource, sortFilters(filters)];
}

export function serializeQueryKey(key: QueryKey): string {
  return JSON.stringify(key);
}

function sortFilters(filters: QueryFilters): QueryFilters {
  return Object.fromEntries(
    Object.entries(filters)
      .filter((entry): entry is [string, string | number | boolean | null] => entry[1] !== undefined)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}
