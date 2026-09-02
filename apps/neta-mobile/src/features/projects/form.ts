import {
  isProjectMutationPayload,
  type LocalizedTextPayload,
  type ProjectMutationPayload,
} from '@neta/api-contracts';
import { buildLocalizedPayload } from '../localization/localized-form.ts';

export type ProjectFormState = {
  clientId: string;
  description: string;
  dueDate: string;
  sourceLocale: string;
  status: ProjectMutationPayload['status'];
  title: string;
  type: ProjectMutationPayload['type'];
};

export type ProjectFormErrors = Partial<Record<'dueDate' | 'title', string | undefined>>;

export function validateProjectForm(form: ProjectFormState): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  if (!form.title.trim()) {
    errors.title = 'Proje başlığı zorunludur.';
  }

  const dueDate = form.dueDate.trim();
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    errors.dueDate = 'Tarih YYYY-AA-GG biçiminde olmalıdır.';
  }

  return errors;
}

export function buildProjectPayload(form: ProjectFormState): ProjectMutationPayload {
  const translations: LocalizedTextPayload = buildLocalizedPayload('project', form.sourceLocale, { description: nullableText(form.description), name: form.title });
  const payload: ProjectMutationPayload = {
    clientId: nullableText(form.clientId),
    dueDate: nullableText(form.dueDate),
    type: form.type,
    translations,
  };

  if (form.status) {
    payload.status = form.status;
  }

  if (!isProjectMutationPayload(payload)) {
    throw new Error('Project form payload is invalid.');
  }

  return payload;
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}
