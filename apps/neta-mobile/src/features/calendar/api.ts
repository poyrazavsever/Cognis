import {
  createIdempotencyKey,
  isCalendarEventDetail,
  isCalendarRangeResponse,
  isDeleteResult,
  type CalendarEventDetail,
  type CalendarEventMutationPayload,
  type CalendarRangeResponse,
  type DeleteResult,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

export type CalendarRangeFilters = {
  from: string;
  to: string;
  timezone: string;
};

export function listCalendarEvents(
  instance: StoredInstance,
  user: MeProfile,
  filters: CalendarRangeFilters,
): Promise<ResourceResult<CalendarRangeResponse>> {
  const params = new URLSearchParams(filters);

  return requestResource(instance, user, {
    cachePolicy: 'short',
    filters,
    parser: parseCalendarRange,
    path: `calendar/events?${params.toString()}`,
    resource: 'calendar',
  });
}

export function getCalendarEventDetail(
  instance: StoredInstance,
  user: MeProfile,
  eventId: string,
): Promise<ResourceResult<CalendarEventDetail>> {
  return requestResource(instance, user, {
    cachePolicy: 'short',
    filters: { eventId },
    parser: parseCalendarEventDetail,
    path: `calendar/events/${encodeURIComponent(eventId)}`,
    resource: 'calendar',
  });
}

export function createCalendarEvent(
  instance: StoredInstance,
  user: MeProfile,
  payload: CalendarEventMutationPayload,
): Promise<ResourceResult<CalendarEventDetail>> {
  return requestResource(instance, user, {
    body: payload,
    idempotencyKey: createIdempotencyKey('calendar-event-create'),
    invalidates: ['calendar'],
    method: 'POST',
    parser: parseCalendarEventDetail,
    path: 'calendar/events',
    resource: 'calendar',
  });
}

export function updateCalendarEvent(
  instance: StoredInstance,
  user: MeProfile,
  eventId: string,
  payload: CalendarEventMutationPayload,
): Promise<ResourceResult<CalendarEventDetail>> {
  return requestResource(instance, user, {
    body: payload,
    invalidates: ['calendar'],
    method: 'PATCH',
    parser: parseCalendarEventDetail,
    path: `calendar/events/${encodeURIComponent(eventId)}`,
    resource: 'calendar',
  });
}

export function deleteCalendarEvent(
  instance: StoredInstance,
  user: MeProfile,
  eventId: string,
): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, {
    method: 'DELETE',
    invalidates: ['calendar'],
    parser: parseDeleteResult,
    path: `calendar/events/${encodeURIComponent(eventId)}`,
    resource: 'calendar',
  });
}

function parseCalendarRange(value: unknown): CalendarRangeResponse {
  if (!isCalendarRangeResponse(value)) {
    throw new NetaClientError('SERVER_ERROR', 'Calendar API kontratı beklenen formatta değil.');
  }

  return value;
}

function parseCalendarEventDetail(value: unknown): CalendarEventDetail {
  if (!isCalendarEventDetail(value)) {
    throw new NetaClientError('SERVER_ERROR', 'Calendar detail API kontratı beklenen formatta değil.');
  }

  return value;
}

function parseDeleteResult(value: unknown): DeleteResult {
  if (!isDeleteResult(value)) {
    throw new NetaClientError('SERVER_ERROR', 'Calendar delete API kontratı beklenen formatta değil.');
  }

  return value;
}
