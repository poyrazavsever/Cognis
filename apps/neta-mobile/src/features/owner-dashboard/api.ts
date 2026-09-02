import {
  type DashboardRange,
  isOwnerDashboardOverview,
  type OwnerDashboardOverview,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';
import { ownerDashboardOverviewPath } from './policy';

export type OwnerDashboardBundle = ResourceResult<OwnerDashboardOverview>;

export async function getOwnerDashboardBundle(
  instance: StoredInstance,
  user: MeProfile,
  range: DashboardRange,
): Promise<OwnerDashboardBundle> {
  return requestResource(instance, user, {
    cachePolicy: 'short',
    filters: { range },
    parser: parseOwnerDashboardOverview,
    path: ownerDashboardOverviewPath(range),
    resource: 'dashboard',
  });
}

function parseOwnerDashboardOverview(value: unknown): OwnerDashboardOverview {
  if (!isOwnerDashboardOverview(value)) {
    throw new NetaClientError('SERVER_ERROR', 'Dashboard özet API kontratı beklenen formatta değil.');
  }

  return value;
}
