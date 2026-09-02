import type { DashboardRange } from '@neta/api-contracts';

export function ownerDashboardOverviewPath(range: DashboardRange) {
  return `dashboard/overview?range=${range}`;
}
