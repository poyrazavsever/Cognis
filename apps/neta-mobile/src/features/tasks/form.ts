import {
  isTaskMutationPayload,
  type LocalizedTextPayload,
  type TaskMutationPayload,
  type TaskPriority,
  type TaskStatus,
} from '@neta/api-contracts';
import { buildLocalizedPayload } from '../localization/localized-form.ts';

export type TaskFormState = {
  actualMinutes: string;
  clientId: string;
  description: string;
  dueAt: string;
  estimatedMinutes: string;
  isPublicToClient: boolean;
  priority: TaskPriority;
  projectId: string;
  scheduledDate: string;
  sourceLocale: string;
  status: TaskStatus;
  title: string;
};

export type TaskFormErrors = Partial<
  Record<'actualMinutes' | 'dueAt' | 'estimatedMinutes' | 'scheduledDate' | 'title', string | undefined>
>;

export function validateTaskForm(form: TaskFormState): TaskFormErrors {
  const errors: TaskFormErrors = {};

  if (!form.title.trim()) {
    errors.title = 'Görev başlığı zorunludur.';
  }

  const scheduledDate = form.scheduledDate.trim();
  if (scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    errors.scheduledDate = 'Tarih YYYY-AA-GG biçiminde olmalıdır.';
  }

  for (const field of ['dueAt'] as const) {
    const value = form[field].trim();
    if (value && Number.isNaN(Date.parse(value))) {
      errors[field] = 'Geçerli bir tarih ve saat gir.';
    }
  }

  for (const field of ['estimatedMinutes', 'actualMinutes'] as const) {
    const minutes = form[field].trim();
    if (minutes && (!/^\d+$/.test(minutes) || Number(minutes) <= 0)) {
      errors[field] = 'Süre pozitif dakika olmalıdır.';
    }
  }

  return errors;
}

export function buildTaskPayload(form: TaskFormState): TaskMutationPayload {
  const translations: LocalizedTextPayload = buildLocalizedPayload('task', form.sourceLocale, { description: nullableText(form.description), name: form.title });
  const payload: TaskMutationPayload = {
    actualMinutes: nullablePositiveInteger(form.actualMinutes),
    clientId: nullableText(form.clientId),
    dueAt: nullableIsoDate(form.dueAt),
    estimatedMinutes: nullablePositiveInteger(form.estimatedMinutes),
    isPublicToClient: form.isPublicToClient,
    priority: form.priority,
    projectId: nullableText(form.projectId),
    scheduledDate: nullableText(form.scheduledDate),
    status: form.status,
    translations,
  };

  if (!isTaskMutationPayload(payload)) {
    throw new Error('Task form payload is invalid.');
  }

  return payload;
}

function nullableIsoDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? new Date(trimmed).toISOString() : null;
}

function nullablePositiveInteger(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}
