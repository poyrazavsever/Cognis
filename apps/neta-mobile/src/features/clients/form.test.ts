import assert from 'node:assert/strict';
import test from 'node:test';

import { isClientMutationPayload } from '@neta/api-contracts';

import { buildClientPayload, validateClientForm } from './form.ts';

test('builds localized client mutation payload', () => {
  const payload = buildClientPayload({
    email: 'client@neta.dev',
    name: 'Acme',
    phone: '',
    pipelineStatus: 'lead',
    sourceLocale: 'tr',
    status: 'active',
  });

  assert.equal(isClientMutationPayload(payload), true);
  assert.deepEqual(payload.translations.tr, { name: 'Acme' });
  assert.equal(payload.phone, null);
});

test('returns accessible field errors for invalid client input', () => {
  const errors = validateClientForm({
    email: 'not-an-email',
    name: ' ',
    phone: '',
    pipelineStatus: 'lead',
    sourceLocale: 'tr',
    status: 'active',
  });

  assert.equal(errors.name, 'Müşteri adı zorunludur.');
  assert.equal(errors.email, 'Geçerli bir email adresi gir.');
});
