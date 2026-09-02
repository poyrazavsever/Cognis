import assert from 'node:assert/strict';
import test from 'node:test';

import { isFinanceTransactionMutationPayload } from '@neta/api-contracts';

import { buildFinancePayload, validateFinanceForm } from './form.ts';

const validForm = {
  amount: '1.250,50',
  category: 'Danışmanlık',
  clientId: '',
  currency: 'try',
  date: '2026-07-26',
  description: 'Temmuz hizmeti',
  kind: 'income' as const,
  locale: 'tr-TR',
  paymentStatus: 'paid' as const,
  projectId: 'project-a',
  sourceLocale: 'tr',
};

test('builds finance mutation with minor amount and localized fields', () => {
  const payload = buildFinancePayload(validForm);
  assert.equal(isFinanceTransactionMutationPayload(payload), true);
  assert.equal(payload.amountMinor, 125050);
  assert.equal(payload.currency, 'TRY');
});

test('validates finance amount, currency, date and category', () => {
  const errors = validateFinanceForm({ ...validForm, amount: '-1', category: '', currency: 'TL', date: '26/07' });
  assert.ok(errors.amount);
  assert.ok(errors.category);
  assert.ok(errors.currency);
  assert.ok(errors.date);
});
