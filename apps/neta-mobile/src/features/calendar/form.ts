import {
  isCalendarEventMutationPayload,
  type CalendarEventMutationPayload,
  type CalendarEventType,
  type LocalizedTextPayload,
} from '@neta/api-contracts';
import { buildLocalizedPayload } from '../localization/localized-form.ts';

import { isValidEventRange } from './date.ts';

export type CalendarEventFormState = {
  clientId: string;
  description: string;
  endAt: Date;
  projectId: string;
  sourceLocale: string;
  startAt: Date;
  taskId: string;
  title: string;
  type: CalendarEventType;
};

export type CalendarEventFormErrors = Partial<Record<'range' | 'title', string | undefined>>;

export function validateCalendarEventForm(form: CalendarEventFormState): CalendarEventFormErrors {
  const errors: CalendarEventFormErrors = {};

  if (!form.title.trim()) {
    errors.title = 'Etkinlik başlığı zorunludur.';
  }

  if (!isValidEventRange(form.startAt, form.endAt)) {
    errors.range = 'Bitiş, başlangıçtan sonra olmalıdır.';
  }

  return errors;
}

export function buildCalendarEventPayload(
  form: CalendarEventFormState,
): CalendarEventMutationPayload {
  const translations: LocalizedTextPayload = buildLocalizedPayload('calendar', form.sourceLocale, { description: nullableText(form.description), name: form.title });
  const payload: CalendarEventMutationPayload = {
    clientId: nullableText(form.clientId),
    endAt: form.endAt.toISOString(),
    projectId: nullableText(form.projectId),
    startAt: form.startAt.toISOString(),
    taskId: nullableText(form.taskId),
    translations,
    type: form.type,
  };

  if (!isCalendarEventMutationPayload(payload)) {
    throw new Error('Calendar event form payload is invalid.');
  }

  return payload;
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}
