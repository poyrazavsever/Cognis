import {
  createIdempotencyKey,
  isPaginatedResponse,
  isPlanningSection,
  isProjectAsset,
  isProjectDetail,
  isProjectListItem,
  isProjectRevision,
  type PaginatedResponse,
  type PlanningSection,
  type ProjectAsset,
  type ProjectDetail,
  type ProjectListItem,
  type ProjectMutationPayload,
  type ProjectRevision,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

export type ProjectListFilters = {
  clientId?: string;
  search?: string;
  status?: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
};

export function listProjects(
  instance: StoredInstance,
  user: MeProfile,
  filters: ProjectListFilters,
): Promise<ResourceResult<PaginatedResponse<ProjectListItem>>> {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.clientId) {
    params.set('clientId', filters.clientId);
  }

  const query = params.toString();

  return requestResource(instance, user, {
    cachePolicy: 'medium',
    filters,
    parser: parseProjectPage,
    path: query ? `projects?${query}` : 'projects',
    resource: 'projects',
  });
}

export function getProjectDetail(
  instance: StoredInstance,
  user: MeProfile,
  projectId: string,
): Promise<ResourceResult<ProjectDetail>> {
  return requestResource(instance, user, {
    cachePolicy: 'medium',
    filters: { projectId },
    parser: parseProjectDetail,
    path: `projects/${encodeURIComponent(projectId)}`,
    resource: 'projects',
  });
}

export function listPlanningSections(
  instance: StoredInstance,
  user: MeProfile,
  projectId: string,
): Promise<ResourceResult<PaginatedResponse<PlanningSection>>> {
  return requestResource(instance, user, {
    cachePolicy: 'medium',
    filters: { projectId },
    parser: parsePlanningSections,
    path: `projects/${encodeURIComponent(projectId)}/planning-sections`,
    resource: 'projects',
  });
}

export function listProjectRevisions(
  instance: StoredInstance,
  user: MeProfile,
  projectId: string,
): Promise<ResourceResult<PaginatedResponse<ProjectRevision>>> {
  return requestResource(instance, user, {
    cachePolicy: 'short',
    filters: { projectId },
    parser: parseProjectRevisions,
    path: `projects/${encodeURIComponent(projectId)}/revisions`,
    resource: 'projects',
  });
}

export function listProjectAssets(
  instance: StoredInstance,
  user: MeProfile,
  projectId: string,
): Promise<ResourceResult<PaginatedResponse<ProjectAsset>>> {
  return requestResource(instance, user, {
    cachePolicy: 'short',
    filters: { projectId },
    parser: parseProjectAssets,
    path: `projects/${encodeURIComponent(projectId)}/assets`,
    resource: 'projects',
  });
}

export function createProject(
  instance: StoredInstance,
  user: MeProfile,
  payload: ProjectMutationPayload,
): Promise<ResourceResult<ProjectDetail>> {
  return requestResource(instance, user, {
    body: payload,
    idempotencyKey: createIdempotencyKey('project-create'),
    method: 'POST',
    parser: parseProjectDetail,
    path: 'projects',
    resource: 'projects',
  });
}

export function updateProject(
  instance: StoredInstance,
  user: MeProfile,
  projectId: string,
  payload: ProjectMutationPayload,
): Promise<ResourceResult<ProjectDetail>> {
  return requestResource(instance, user, {
    body: payload,
    method: 'PATCH',
    parser: parseProjectDetail,
    path: `projects/${encodeURIComponent(projectId)}`,
    resource: 'projects',
  });
}

export function completeProject(
  instance: StoredInstance,
  user: MeProfile,
  projectId: string,
  payload: ProjectMutationPayload,
): Promise<ResourceResult<ProjectDetail>> {
  return updateProject(instance, user, projectId, {
    ...payload,
    status: 'completed',
  });
}

function parseProjectPage(value: unknown): PaginatedResponse<ProjectListItem> {
  if (!isPaginatedResponse(value, isProjectListItem)) {
    throw new NetaClientError('SERVER_ERROR', 'Projects API kontratı beklenen formatta değil.');
  }

  return value;
}

function parseProjectDetail(value: unknown): ProjectDetail {
  if (!isProjectDetail(value)) {
    throw new NetaClientError('SERVER_ERROR', 'Project detail API kontratı beklenen formatta değil.');
  }

  return value;
}

function parsePlanningSections(value: unknown): PaginatedResponse<PlanningSection> {
  if (!isPaginatedResponse(value, isPlanningSection)) {
    throw new NetaClientError('SERVER_ERROR', 'Planning sections API kontratı beklenen formatta değil.');
  }

  return value;
}

function parseProjectRevisions(value: unknown): PaginatedResponse<ProjectRevision> {
  if (!isPaginatedResponse(value, isProjectRevision)) {
    throw new NetaClientError('SERVER_ERROR', 'Project revisions API kontratı beklenen formatta değil.');
  }
  return value;
}

function parseProjectAssets(value: unknown): PaginatedResponse<ProjectAsset> {
  if (!isPaginatedResponse(value, isProjectAsset)) {
    throw new NetaClientError('SERVER_ERROR', 'Project assets API kontratı beklenen formatta değil.');
  }
  return value;
}
