import type { PortalRevisionMutationPayload } from '@neta/api-contracts';

export type RevisionFormErrors = { description?: string; sourceLocale?: string };

export function validateRevisionRequest(description: string, sourceLocale: string): RevisionFormErrors {
  const errors: RevisionFormErrors = {};
  const length = description.trim().length;
  if (length < 10) errors.description = 'Revizyon açıklaması en az 10 karakter olmalıdır.';
  else if (length > 2_000) errors.description = 'Revizyon açıklaması en fazla 2000 karakter olabilir.';
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(sourceLocale)) errors.sourceLocale = 'Geçerli bir kaynak dil seç.';
  return errors;
}

export function buildRevisionRequest(description: string, sourceLocale: string): PortalRevisionMutationPayload {
  return { description: description.trim(), sourceLocale };
}
