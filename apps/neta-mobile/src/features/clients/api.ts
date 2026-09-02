import {
  createIdempotencyKey,
  type ClientActivity,
  type ClientActivityMutationPayload,
  type ClientDetail,
  type ClientListItem,
  type ClientMutationPayload,
  isClientActivity,
  isClientDetail,
  isClientListItem,
  isPaginatedResponse,
  type PaginatedResponse,
  type PortalInvitationPayload,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

export type ClientListFilters = {
  search?: string;
  status?: 'active' | 'paused' | 'archived';
};

export async function listClients(
  instance: StoredInstance,
  user: MeProfile,
  filters: ClientListFilters,
): Promise<ResourceResult<PaginatedResponse<ClientListItem>>> {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  const query = params.toString();

  return requestResource(instance, user, {
    cachePolicy: 'medium',
    filters,
    parser: parseClientPage,
    path: query ? `clients?${query}` : 'clients',
    resource: 'clients',
  });
}

export function getClientDetail(
  instance: StoredInstance,
  user: MeProfile,
  clientId: string,
): Promise<ResourceResult<ClientDetail>> {
  return requestResource(instance, user, {
    cachePolicy: 'medium',
    filters: { clientId },
    parser: parseClientDetail,
    path: `clients/${encodeURIComponent(clientId)}`,
    resource: 'clients',
  });
}

export function listClientActivities(
  instance: StoredInstance,
  user: MeProfile,
  clientId: string,
): Promise<ResourceResult<PaginatedResponse<ClientActivity>>> {
  return requestResource(instance, user, {
    cachePolicy: 'short',
    filters: { clientId },
    parser: parseClientActivityPage,
    path: `clients/${encodeURIComponent(clientId)}/activities`,
    resource: 'clients',
  });
}

export function createClientActivity(
  instance: StoredInstance,
  user: MeProfile,
  clientId: string,
  payload: ClientActivityMutationPayload,
): Promise<ResourceResult<ClientActivity>> {
  return requestResource(instance, user, {
    body: payload,
    idempotencyKey: createIdempotencyKey('client-activity-create'),
    invalidates: ['clients'],
    method: 'POST',
    parser: parseClientActivity,
    path: `clients/${encodeURIComponent(clientId)}/activities`,
    resource: 'clients',
  });
}

export function createClient(
  instance: StoredInstance,
  user: MeProfile,
  payload: ClientMutationPayload,
): Promise<ResourceResult<ClientDetail>> {
  return requestResource(instance, user, {
    body: payload,
    idempotencyKey: createIdempotencyKey('client-create'),
    method: 'POST',
    parser: parseClientDetail,
    path: 'clients',
    resource: 'clients',
  });
}

export function updateClient(
  instance: StoredInstance,
  user: MeProfile,
  clientId: string,
  payload: ClientMutationPayload,
): Promise<ResourceResult<ClientDetail>> {
  return requestResource(instance, user, {
    body: payload,
    method: 'PATCH',
    parser: parseClientDetail,
    path: `clients/${encodeURIComponent(clientId)}`,
    resource: 'clients',
  });
}

export function archiveClient(
  instance: StoredInstance,
  user: MeProfile,
  clientId: string,
): Promise<ResourceResult<ClientDetail>> {
  return updateClient(instance, user, clientId, {
    status: 'archived',
    translations: {},
  });
}

export function inviteClientPortal(
  instance: StoredInstance,
  user: MeProfile,
  clientId: string,
  payload: PortalInvitationPayload,
): Promise<ResourceResult<ClientDetail>> {
  return requestResource(instance, user, {
    body: payload,
    idempotencyKey: createIdempotencyKey('portal-invite'),
    method: 'POST',
    parser: parseClientDetail,
    path: `clients/${encodeURIComponent(clientId)}/portal-invitations`,
    resource: 'clients',
  });
}

function parseClientPage(value: unknown): PaginatedResponse<ClientListItem> {
  if (!isPaginatedResponse(value, isClientListItem)) {
    throw new NetaClientError('SERVER_ERROR', 'Clients API kontratı beklenen formatta değil.');
  }

  return value;
}

function parseClientActivityPage(value: unknown): PaginatedResponse<ClientActivity> {
  if (!isPaginatedResponse(value, isClientActivity)) {
    throw new NetaClientError('SERVER_ERROR', 'Client activity API kontratı beklenen formatta değil.');
  }

  return value;
}

function parseClientActivity(value: unknown): ClientActivity {
  if (!isClientActivity(value)) {
    throw new NetaClientError('SERVER_ERROR', 'Client activity API kontratı beklenen formatta değil.');
  }

  return value;
}

function parseClientDetail(value: unknown): ClientDetail {
  if (!isClientDetail(value)) {
    throw new NetaClientError('SERVER_ERROR', 'Client detail API kontratı beklenen formatta değil.');
  }

  return value;
}
