import assert from 'node:assert/strict';
import test from 'node:test';

import { isTaskMutationPayload } from '@neta/api-contracts';

import { buildTaskPayload, validateTaskForm } from './form.ts';

const validForm = {
  actualMinutes: '',
  clientId: '',
  description: 'Mobile task',
  dueAt: '2026-08-01T12:00:00+03:00',
  estimatedMinutes: '90',
  isPublicToClient: true,
  priority: 'high' as const,
  projectId: 'project-a',
  scheduledDate: '',
  sourceLocale: 'tr',
  status: 'todo' as const,
  title: 'Görev',
};

test('builds localized task mutation payload', () => {
  const payload = buildTaskPayload(validForm);

  assert.equal(isTaskMutationPayload(payload), true);
  assert.equal(payload.estimatedMinutes, 90);
  assert.equal(payload.isPublicToClient, true);
});

test('validates task title, date and duration', () => {
  const errors = validateTaskForm({
    ...validForm,
    dueAt: 'not-a-date',
    estimatedMinutes: '0',
    title: ' ',
  });

  assert.ok(errors.title);
  assert.ok(errors.dueAt);
  assert.ok(errors.estimatedMinutes);
});
