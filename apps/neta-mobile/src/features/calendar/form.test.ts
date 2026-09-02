import assert from 'node:assert/strict';
import test from 'node:test';

import { isCalendarEventMutationPayload } from '@neta/api-contracts';

import { buildCalendarEventPayload, validateCalendarEventForm } from './form.ts';

const form = {
  clientId: '',
  description: 'Görüşme',
  endAt: new Date('2026-08-01T11:00:00Z'),
  projectId: 'project-a',
  sourceLocale: 'tr',
  startAt: new Date('2026-08-01T10:00:00Z'),
  taskId: '',
  title: 'Kickoff',
  type: 'meeting' as const,
};

test('builds calendar payload with absolute instants', () => {
  const payload = buildCalendarEventPayload(form);

  assert.equal(isCalendarEventMutationPayload(payload), true);
  assert.equal(payload.startAt, '2026-08-01T10:00:00.000Z');
});

test('validates calendar title and chronological range', () => {
  const errors = validateCalendarEventForm({ ...form, endAt: form.startAt, title: '' });

  assert.ok(errors.title);
  assert.ok(errors.range);
});
