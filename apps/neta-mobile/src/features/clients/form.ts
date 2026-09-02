import {
  type ClientMutationPayload,
  type ClientPipelineStatus,
  isClientMutationPayload,
  type LocalizedTextPayload,
} from '@neta/api-contracts';
import { buildLocalizedPayload } from '../localization/localized-form.ts';

export type ClientFormState = {
  email: string;
  name: string;
  phone: string;
  pipelineStatus: ClientPipelineStatus;
  sourceLocale: string;
  status: ClientMutationPayload['status'];
};

export type ClientFormErrors = Partial<Record<'email' | 'name', string | undefined>>;

export function validateClientForm(form: ClientFormState): ClientFormErrors {
  const errors: ClientFormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Müşteri adı zorunludur.';
  }

  const email = form.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Geçerli bir email adresi gir.';
  }

  return errors;
}

export function buildClientPayload(form: ClientFormState): ClientMutationPayload {
  const translations: LocalizedTextPayload = buildLocalizedPayload('client', form.sourceLocale, { name: form.name });
  const payload: ClientMutationPayload = {
    email: nullableText(form.email),
    phone: nullableText(form.phone),
    pipelineStatus: form.pipelineStatus,
    translations,
  };

  if (form.status) {
    payload.status = form.status;
  }

  if (!isClientMutationPayload(payload)) {
    throw new Error('Client form payload is invalid.');
  }

  return payload;
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}
