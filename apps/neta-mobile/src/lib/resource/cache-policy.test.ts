import assert from 'node:assert/strict';
import test from 'node:test';

import { effectiveCachePolicy, resourceSensitivity } from './cache-policy.ts';

test('never persists secret resources even when a caller requests caching', () => {
  for (const resource of ['chat', 'finance', 'journal', 'me', 'settings'] as const) {
    assert.equal(resourceSensitivity(resource), 'secret');
    assert.equal(effectiveCachePolicy(resource, 'long'), 'none');
  }
});

test('caps private data and permits long-lived public localization', () => {
  assert.equal(effectiveCachePolicy('portal', 'long'), 'short');
  assert.equal(effectiveCachePolicy('projects', 'long'), 'medium');
  assert.equal(effectiveCachePolicy('localization', 'long'), 'long');
});
