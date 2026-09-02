import {
  createIdempotencyKey,
  isPortalDashboard,
  isPortalLocalizedPage,
  isPortalProfile,
  isPortalProjectDetail,
  isPortalProjectSummary,
  isPortalRevision,
  isPortalTask,
  type PortalDashboard,
  type PortalLocalizedPage,
  type PortalProfile,
  type PortalProfileMutationPayload,
  type PortalProjectDetail,
  type PortalProjectSummary,
  type PortalRevision,
  type PortalRevisionMutationPayload,
  type PortalTask,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

import { assertPortalActor, assertPortalPath, matchesPortalProjectScope } from './authorization';

type PortalListFilters = { cursor?: string; projectId?: string; status?: string };

export function getPortalDashboard(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<PortalDashboard>> {
  return portalRequest(instance, user, 'portal/dashboard', isPortalDashboard, { cachePolicy: 'short', filters: {} });
}

export function listPortalProjects(instance: StoredInstance, user: MeProfile, cursor?: string): Promise<ResourceResult<PortalLocalizedPage<PortalProjectSummary>>> {
  const filters: PortalListFilters = cursor ? { cursor } : {};
  const path = withQuery('portal/projects', filters);
  return portalRequest(instance, user, path, isProjects, { cachePolicy: 'medium', filters });
}

export function getPortalProject(instance: StoredInstance, user: MeProfile, projectId: string): Promise<ResourceResult<PortalProjectDetail>> {
  return portalRequest(instance, user, `portal/projects/${encodeURIComponent(projectId)}`, (value): value is PortalProjectDetail => isPortalProjectForRequest(instance, projectId, value), { cachePolicy: 'medium', filters: { projectId } });
}

export function isPortalProjectForRequest(instance: StoredInstance, projectId: string, value: unknown): value is PortalProjectDetail {
  return isPortalProjectDetail(value) && matchesPortalProjectScope(projectId, value) && value.assets.every((asset) => isInstanceBoundUrl(instance, asset.url));
}

export function listPortalTasks(instance: StoredInstance, user: MeProfile, filters: PortalListFilters = {}): Promise<ResourceResult<PortalLocalizedPage<PortalTask>>> {
  const path = withQuery('portal/tasks', filters);
  return portalRequest(instance, user, path, isTasks, { cachePolicy: 'medium', filters });
}

export function listPortalRevisions(instance: StoredInstance, user: MeProfile, filters: PortalListFilters = {}): Promise<ResourceResult<PortalLocalizedPage<PortalRevision>>> {
  const path = withQuery('portal/revisions', filters);
  return portalRequest(instance, user, path, isRevisions, { cachePolicy: 'medium', filters });
}

export function createPortalRevision(instance: StoredInstance, user: MeProfile, projectId: string, payload: PortalRevisionMutationPayload): Promise<ResourceResult<PortalRevision>> {
  return portalRequest(instance, user, `portal/projects/${encodeURIComponent(projectId)}/revisions`, isPortalRevision, {
    body: payload,
    idempotencyKey: createIdempotencyKey('portal-revision'),
    invalidates: ['portal'],
    method: 'POST',
  });
}

export function getPortalProfile(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<PortalProfile>> {
  return portalRequest(instance, user, 'portal/profile', isPortalProfile, { cachePolicy: 'short', filters: {} });
}

export function updatePortalProfile(instance: StoredInstance, user: MeProfile, payload: PortalProfileMutationPayload): Promise<ResourceResult<PortalProfile>> {
  return portalRequest(instance, user, 'portal/profile', isPortalProfile, { body: payload, invalidates: ['portal', 'me'], method: 'PATCH' });
}

type PortalOptions = {
  body?: unknown;
  cachePolicy?: 'none' | 'short' | 'medium' | 'long';
  filters?: PortalListFilters;
  idempotencyKey?: string;
  invalidates?: ('portal' | 'me')[];
  method?: 'GET' | 'POST' | 'PATCH';
};

function portalRequest<T>(instance: StoredInstance, user: MeProfile, path: string, guard: (value: unknown) => value is T, options: PortalOptions): Promise<ResourceResult<T>> {
  assertPortalActor(user);
  assertPortalPath(path);
  return requestResource(instance, user, {
    ...options,
    parser: (value) => parseContract(value, guard),
    path,
    resource: 'portal',
  });
}

function isProjects(value: unknown): value is PortalLocalizedPage<PortalProjectSummary> {
  return isPortalLocalizedPage(value, isPortalProjectSummary);
}

function isTasks(value: unknown): value is PortalLocalizedPage<PortalTask> {
  return isPortalLocalizedPage(value, isPortalTask);
}

function isRevisions(value: unknown): value is PortalLocalizedPage<PortalRevision> {
  return isPortalLocalizedPage(value, isPortalRevision);
}

function parseContract<T>(value: unknown, guard: (candidate: unknown) => candidate is T): T {
  if (!guard(value)) throw new NetaClientError('SERVER_ERROR', 'Portal API kontratı beklenen güvenli formatta değil.');
  return value;
}

function withQuery(path: string, filters: PortalListFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function isInstanceBoundUrl(instance: StoredInstance, value: string): boolean {
  try { return new URL(value).origin === new URL(instance.origin).origin; } catch { return false; }
}
