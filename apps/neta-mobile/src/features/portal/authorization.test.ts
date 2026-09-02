import assert from 'node:assert/strict';
import test from 'node:test';

import type { PortalProjectDetail } from '@neta/api-contracts';
import { assertPortalActor, assertPortalPath, canAccessRoute, matchesPortalProjectScope } from './authorization.ts';

const client = { id: 'client-user', email: null, name: 'Client', role: 'client' as const };
const owner = { id: 'owner-user', email: null, name: 'Owner', role: 'freelancer' as const };

test('allows only client actors on portal requests', () => {
  assert.doesNotThrow(() => assertPortalActor(client));
  assert.throws(() => assertPortalActor(owner), { message: 'Bu kaynak yalnız müşteri portalına açıktır.' });
});

test('rejects owner paths, traversal and caller-controlled client scope', () => {
  assert.doesNotThrow(() => assertPortalPath('portal/projects/project-1'));
  assert.throws(() => assertPortalPath('projects/project-1'));
  assert.throws(() => assertPortalPath('portal/../settings/ai'));
  assert.throws(() => assertPortalPath('portal/%2e%2e/settings/ai'));
  assert.throws(() => assertPortalPath('portal/projects?clientId=other'));
});

test('keeps owner and portal route groups mutually exclusive', () => {
  assert.equal(canAccessRoute('client', 'portal'), true);
  assert.equal(canAccessRoute('client', 'owner'), false);
  assert.equal(canAccessRoute('freelancer', 'owner'), true);
  assert.equal(canAccessRoute('freelancer', 'portal'), false);
});

test('rejects cross-project resources in a portal project response', () => {
  const detail: PortalProjectDetail = {
    assets: [],
    fallbackChain: ['tr'],
    locale: 'tr',
    localized: { description: null, title: 'Mobil uygulama' },
    planningSections: [],
    publicTasks: [{ description: null, dueAt: null, id: 'task-a', isPublicToClient: true, priority: 'medium', projectId: 'project-a', projectName: 'Mobil uygulama', status: 'todo', title: 'Onay', updatedAt: '2026-07-29T10:00:00.000Z' }],
    resource: { dueDate: null, id: 'project-a', progress: 50, status: 'active', updatedAt: '2026-07-29T10:00:00.000Z' },
    revisionAllowance: { allowed: null, canRequest: true, remaining: null, used: 0 },
    revisions: [],
  };

  assert.equal(matchesPortalProjectScope('project-a', detail), true);
  assert.equal(matchesPortalProjectScope('project-b', detail), false);
  assert.equal(matchesPortalProjectScope('project-a', { ...detail, publicTasks: [{ ...detail.publicTasks[0]!, projectId: 'project-b' }] }), false);
  assert.equal(matchesPortalProjectScope('project-a', { ...detail, revisions: [{ createdAt: '2026-07-29T10:00:00.000Z', description: 'Değişiklik', id: 'revision-a', projectId: 'project-b', projectName: 'Başka proje', sourceLocale: 'tr', status: 'pending', updatedAt: '2026-07-29T10:00:00.000Z' }] }), false);
});
