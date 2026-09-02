import {
  isDeleteResult,
  isJournalEntryDetail,
  isJournalRangeResponse,
  type DeleteResult,
  type JournalEntryDetail,
  type JournalEntryMutationPayload,
  type JournalRangeResponse,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

export function listJournalEntries(instance: StoredInstance, user: MeProfile, from: string, to: string): Promise<ResourceResult<JournalRangeResponse>> {
  const normalizedFrom = from.slice(0, 10);
  const normalizedTo = to.slice(0, 10);
  const query = new URLSearchParams({ from: normalizedFrom, to: normalizedTo }).toString();
  return requestResource(instance, user, { cachePolicy: 'medium', filters: { from: normalizedFrom, to: normalizedTo }, parser: parseRange, path: `journal/entries?${query}`, resource: 'journal' });
}

export function getJournalEntry(instance: StoredInstance, user: MeProfile, id: string): Promise<ResourceResult<JournalEntryDetail>> {
  return requestResource(instance, user, { cachePolicy: 'short', filters: { id }, parser: parseDetail, path: `journal/entries/${encodeURIComponent(id)}`, resource: 'journal' });
}

export function upsertJournalEntry(instance: StoredInstance, user: MeProfile, date: string, payload: JournalEntryMutationPayload): Promise<ResourceResult<JournalEntryDetail>> {
  return requestResource(instance, user, { body: payload, invalidates: ['journal', 'dashboard', 'calendar'], method: 'PUT', parser: parseDetail, path: `journal/entries/${encodeURIComponent(date)}`, resource: 'journal' });
}

export function updateJournalEntry(instance: StoredInstance, user: MeProfile, id: string, payload: JournalEntryMutationPayload): Promise<ResourceResult<JournalEntryDetail>> {
  return requestResource(instance, user, { body: payload, invalidates: ['journal', 'dashboard', 'calendar'], method: 'PATCH', parser: parseDetail, path: `journal/entries/${encodeURIComponent(id)}`, resource: 'journal' });
}

export function deleteJournalEntry(instance: StoredInstance, user: MeProfile, id: string): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, { invalidates: ['journal', 'dashboard', 'calendar'], method: 'DELETE', parser: parseDelete, path: `journal/entries/${encodeURIComponent(id)}`, resource: 'journal' });
}

function parseRange(value: unknown): JournalRangeResponse {
  if (!isJournalRangeResponse(value)) throw contractError('Journal range');
  return value;
}

function parseDetail(value: unknown): JournalEntryDetail {
  if (!isJournalEntryDetail(value)) throw contractError('Journal detail');
  return value;
}

function parseDelete(value: unknown): DeleteResult {
  if (!isDeleteResult(value)) throw contractError('Journal delete');
  return value;
}

function contractError(resource: string): NetaClientError {
  return new NetaClientError('SERVER_ERROR', `${resource} API kontratı beklenen formatta değil.`);
}
