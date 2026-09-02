import assert from 'node:assert/strict';
import test from 'node:test';

import { shellRouteTitle, shellSection, shouldShowShellBack } from './shell-policy.ts';

test('keeps owner and portal primary navigation maps deterministic', () => {
  assert.equal(shellSection('owner', '/clients'), 'clients');
  assert.equal(shellSection('owner', '/calendar'), 'others');
  assert.equal(shellSection('portal', '/revisions'), 'revisions');
  assert.equal(shellSection('portal', '/settings'), 'others');
});

test('shows a back action only on nested detail routes', () => {
  assert.equal(shouldShowShellBack('/projects'), false);
  assert.equal(shouldShowShellBack('/projects/project-a'), true);
  assert.equal(shellRouteTitle('/projects/project-a', 'portal'), 'Proje Detayı');
  assert.equal(shellRouteTitle('/clients/client-a', 'owner'), 'Müşteri Detayı');
  assert.equal(shellRouteTitle('/tasks/task-a', 'owner'), 'Görev Detayı');
});
