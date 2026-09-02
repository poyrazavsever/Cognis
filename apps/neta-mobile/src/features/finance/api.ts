import {
  createIdempotencyKey,
  isDeleteResult,
  isFinanceAnalysis,
  isFinanceSummary,
  isFinanceTransactionDetail,
  isFinanceTransactionListItem,
  isPaginatedResponse,
  type DeleteResult,
  type FinanceAnalysis,
  type FinancePaymentStatus,
  type FinanceSummary,
  type FinanceTransactionDetail,
  type FinanceTransactionKind,
  type FinanceTransactionListItem,
  type FinanceTransactionMutationPayload,
  type PaginatedResponse,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

export type FinanceTransactionFilters = {
  clientId?: string;
  cursor?: string;
  kind?: FinanceTransactionKind;
  month?: string;
  paymentStatus?: FinancePaymentStatus;
  projectId?: string;
  search?: string;
};

export function getFinanceSummary(
  instance: StoredInstance,
  user: MeProfile,
  month: string,
): Promise<ResourceResult<FinanceSummary>> {
  return requestResource(instance, user, {
    cachePolicy: 'short',
    filters: { month },
    parser: parseFinanceSummary,
    path: `finance/summary?${new URLSearchParams({ month }).toString()}`,
    resource: 'finance',
  });
}

export function listFinanceTransactions(
  instance: StoredInstance,
  user: MeProfile,
  filters: FinanceTransactionFilters,
): Promise<ResourceResult<PaginatedResponse<FinanceTransactionListItem>>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return requestResource(instance, user, {
    cachePolicy: 'medium',
    filters,
    parser: parseFinanceTransactionPage,
    path: query ? `finance/transactions?${query}` : 'finance/transactions',
    resource: 'finance',
  });
}

export function getFinanceTransactionDetail(
  instance: StoredInstance,
  user: MeProfile,
  transactionId: string,
): Promise<ResourceResult<FinanceTransactionDetail>> {
  return requestResource(instance, user, {
    cachePolicy: 'short',
    filters: { transactionId },
    parser: parseFinanceTransactionDetail,
    path: `finance/transactions/${encodeURIComponent(transactionId)}`,
    resource: 'finance',
  });
}

export function createFinanceTransaction(
  instance: StoredInstance,
  user: MeProfile,
  payload: FinanceTransactionMutationPayload,
): Promise<ResourceResult<FinanceTransactionDetail>> {
  return requestResource(instance, user, {
    body: payload,
    idempotencyKey: createIdempotencyKey('finance-create'),
    invalidates: ['finance', 'dashboard', 'calendar'],
    method: 'POST',
    parser: parseFinanceTransactionDetail,
    path: 'finance/transactions',
    resource: 'finance',
  });
}

export function updateFinanceTransaction(
  instance: StoredInstance,
  user: MeProfile,
  transactionId: string,
  payload: FinanceTransactionMutationPayload,
): Promise<ResourceResult<FinanceTransactionDetail>> {
  return requestResource(instance, user, {
    body: payload,
    invalidates: ['finance', 'dashboard', 'calendar'],
    method: 'PATCH',
    parser: parseFinanceTransactionDetail,
    path: `finance/transactions/${encodeURIComponent(transactionId)}`,
    resource: 'finance',
  });
}

export function deleteFinanceTransaction(
  instance: StoredInstance,
  user: MeProfile,
  transactionId: string,
): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, {
    invalidates: ['finance', 'dashboard', 'calendar'],
    method: 'DELETE',
    parser: parseDeleteResult,
    path: `finance/transactions/${encodeURIComponent(transactionId)}`,
    resource: 'finance',
  });
}

export function requestFinanceAnalysis(
  instance: StoredInstance,
  user: MeProfile,
  month: string,
): Promise<ResourceResult<FinanceAnalysis>> {
  return requestResource(instance, user, {
    body: { month },
    idempotencyKey: createIdempotencyKey('finance-analysis'),
    method: 'POST',
    parser: parseFinanceAnalysis,
    path: 'finance/analysis',
    resource: 'finance',
  });
}

function parseFinanceSummary(value: unknown): FinanceSummary {
  if (!isFinanceSummary(value)) throw contractError('Finance summary');
  return value;
}

function parseFinanceTransactionPage(value: unknown): PaginatedResponse<FinanceTransactionListItem> {
  if (!isPaginatedResponse(value, isFinanceTransactionListItem)) throw contractError('Finance list');
  return value;
}

function parseFinanceTransactionDetail(value: unknown): FinanceTransactionDetail {
  if (!isFinanceTransactionDetail(value)) throw contractError('Finance detail');
  return value;
}

function parseFinanceAnalysis(value: unknown): FinanceAnalysis {
  if (!isFinanceAnalysis(value)) throw contractError('Finance analysis');
  return value;
}

function parseDeleteResult(value: unknown): DeleteResult {
  if (!isDeleteResult(value)) throw contractError('Finance delete');
  return value;
}

function contractError(resource: string): NetaClientError {
  return new NetaClientError('SERVER_ERROR', `${resource} API kontratı beklenen formatta değil.`);
}
