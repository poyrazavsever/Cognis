import assert from 'node:assert/strict';
import test from 'node:test';

import { isProjectMutationPayload } from '@neta/api-contracts';

import { buildProjectPayload, validateProjectForm } from './form.ts';

test('builds localized project mutation payload', () => {
  const payload = buildProjectPayload({
    clientId: 'client-a',
    description: 'Mobile app',
    dueDate: '2026-08-01',
    sourceLocale: 'en',
    status: 'active',
    title: 'Neta Mobile',
    type: 'client_project',
  });

  assert.equal(isProjectMutationPayload(payload), true);
  assert.deepEqual(payload.translations.en, {
    description: 'Mobile app',
    name: 'Neta Mobile',
  });
});

test('returns accessible field errors for invalid project input', () => {
  const errors = validateProjectForm({
    clientId: '',
    description: '',
    dueDate: '26/08/01',
    sourceLocale: 'tr',
    status: 'active',
    title: '',
    type: 'side_project',
  });

  assert.equal(errors.title, 'Proje başlığı zorunludur.');
  assert.equal(errors.dueDate, 'Tarih YYYY-AA-GG biçiminde olmalıdır.');
});
