import assert from 'node:assert/strict';
import test from 'node:test';

import { genericNotificationPreview, parseNotificationData, resolveNotificationRoute } from './policy.ts';

const payload = {
  eventId: 'event-a',
  eventType: 'task.deadline',
  instanceId: 'instance-a',
  projectId: 'project-a',
  recipientRole: 'freelancer',
  recipientUserId: 'user-a',
  resourceId: 'task-a',
  schemaVersion: 1,
} as const;

test('opens only an allowlisted route for the active instance and actor', () => {
  const session = { instance: { instanceId: 'instance-a' }, user: { id: 'user-a', role: 'freelancer' as const } };
  assert.equal(resolveNotificationRoute(payload, session), '/(owner)/tasks');
  assert.equal(resolveNotificationRoute({ ...payload, instanceId: 'instance-b' }, session), null);
  assert.equal(resolveNotificationRoute({ ...payload, recipientUserId: 'user-b' }, session), null);
  assert.equal(resolveNotificationRoute({ ...payload, recipientRole: 'client' }, session), null);
});

test('rejects caller routes, preview content and malformed identifiers', () => {
  assert.equal(parseNotificationData({ ...payload, route: '/(owner)/finance' }), null);
  assert.equal(parseNotificationData({ ...payload, title: 'Gizli müşteri adı' }), null);
  assert.equal(parseNotificationData({ ...payload, resourceId: '../finance' }), null);
});

test('uses a content-free lock-screen preview', () => {
  const preview = genericNotificationPreview();
  assert.deepEqual(Object.keys(preview).sort(), ['body', 'title']);
  assert.doesNotMatch(preview.body, /task|project|revision|müşteri|tutar/i);
});
