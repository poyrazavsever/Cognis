import type { CachePolicy, ResourceName } from '@neta/api-contracts';

export type ResourceSensitivity = 'public' | 'private' | 'secret';

const MATRIX: Record<ResourceName, { maxPolicy: CachePolicy; sensitivity: ResourceSensitivity }> = {
  analytics: { maxPolicy: 'short', sensitivity: 'private' },
  calendar: { maxPolicy: 'short', sensitivity: 'private' },
  chat: { maxPolicy: 'none', sensitivity: 'secret' },
  clients: { maxPolicy: 'short', sensitivity: 'private' },
  dashboard: { maxPolicy: 'short', sensitivity: 'private' },
  files: { maxPolicy: 'none', sensitivity: 'private' },
  finance: { maxPolicy: 'none', sensitivity: 'secret' },
  journal: { maxPolicy: 'none', sensitivity: 'secret' },
  localization: { maxPolicy: 'long', sensitivity: 'public' },
  me: { maxPolicy: 'none', sensitivity: 'secret' },
  portal: { maxPolicy: 'short', sensitivity: 'private' },
  projects: { maxPolicy: 'medium', sensitivity: 'private' },
  settings: { maxPolicy: 'none', sensitivity: 'secret' },
  tasks: { maxPolicy: 'medium', sensitivity: 'private' },
};

const RANK: Record<CachePolicy, number> = { none: 0, short: 1, medium: 2, long: 3 };

export function effectiveCachePolicy(resource: ResourceName, requested: CachePolicy): CachePolicy {
  const cap = MATRIX[resource].maxPolicy;
  return RANK[requested] <= RANK[cap] ? requested : cap;
}

export function resourceSensitivity(resource: ResourceName): ResourceSensitivity {
  return MATRIX[resource].sensitivity;
}
