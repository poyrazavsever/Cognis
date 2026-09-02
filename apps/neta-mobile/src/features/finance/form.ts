import {
  isFinanceTransactionMutationPayload,
  type FinancePaymentStatus,
  type FinanceTransactionKind,
  type FinanceTransactionMutationPayload,
  type LocalizedFinancePayload,
} from '@neta/api-contracts';

import { parseMajorAmountToMinor } from './money.ts';
import { buildLocalizedPayload } from '../localization/localized-form.ts';

export type FinanceFormState = {
  amount: string;
  category: string;
  clientId: string;
  currency: string;
  date: string;
  description: string;
  kind: FinanceTransactionKind;
  locale: string;
  paymentStatus: FinancePaymentStatus;
  projectId: string;
  sourceLocale: string;
  version?: string | null;
};

export type FinanceFormErrors = Partial<
  Record<'amount' | 'category' | 'currency' | 'date', string | undefined>
>;

export function validateFinanceForm(form: FinanceFormState): FinanceFormErrors {
  const errors: FinanceFormErrors = {};
  const amountMinor = parseMajorAmountToMinor(form.amount, form.currency, form.locale);
  if (amountMinor === null || amountMinor <= 0) {
    errors.amount = 'Geçerli ve pozitif bir tutar gir.';
  }
  if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) errors.currency = 'Üç harfli para birimi gir.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim())) errors.date = 'Tarih YYYY-AA-GG biçiminde olmalıdır.';
  if (!form.category.trim()) errors.category = 'Kategori zorunludur.';
  return errors;
}

export function buildFinancePayload(form: FinanceFormState): FinanceTransactionMutationPayload {
  const currency = form.currency.trim().toUpperCase();
  const amountMinor = parseMajorAmountToMinor(form.amount, currency, form.locale);
  if (amountMinor === null || amountMinor <= 0) throw new Error('Finance amount is invalid.');
  const translations: LocalizedFinancePayload = buildLocalizedPayload('finance', form.sourceLocale, { category: form.category, description: nullableText(form.description) });
  const payload: FinanceTransactionMutationPayload = {
    amountMinor,
    clientId: nullableText(form.clientId),
    currency,
    date: form.date.trim(),
    kind: form.kind,
    paymentStatus: form.paymentStatus,
    projectId: nullableText(form.projectId),
    translations,
    ...(form.version !== undefined ? { version: form.version } : {}),
  };

  if (!isFinanceTransactionMutationPayload(payload)) throw new Error('Finance payload is invalid.');
  return payload;
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}
