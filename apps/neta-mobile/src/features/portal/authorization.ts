import { NetaClientError } from '../../lib/api/errors.ts';
import type { PortalProjectDetail } from '@neta/api-contracts';
import type { MeProfile } from '../../lib/instance/types.ts';

const PORTAL_PREFIX = 'portal/';

export function assertPortalActor(user: MeProfile): void {
  if (user.role !== 'client') {
    throw new NetaClientError('FORBIDDEN', 'Bu kaynak yalnız müşteri portalına açıktır.', 403);
  }
}

export function assertPortalPath(path: string): void {
  let decoded = path;
  try { decoded = decodeURIComponent(path); } catch { throw new NetaClientError('FORBIDDEN', 'Portal isteği güvenli scope dışında.', 403); }
  if (!decoded.startsWith(PORTAL_PREFIX) || decoded.includes('..') || /(?:^|[?&])clientId=/i.test(decoded)) {
    throw new NetaClientError('FORBIDDEN', 'Portal isteği güvenli scope dışında.', 403);
  }
}

export function canAccessRoute(role: MeProfile['role'], routeGroup: 'owner' | 'portal'): boolean {
  return (role === 'freelancer' && routeGroup === 'owner') || (role === 'client' && routeGroup === 'portal');
}

export function matchesPortalProjectScope(projectId: string, detail: PortalProjectDetail): boolean {
  return detail.resource.id === projectId &&
    detail.publicTasks.every((task) => task.projectId === projectId) &&
    detail.revisions.every((revision) => revision.projectId === projectId);
}
