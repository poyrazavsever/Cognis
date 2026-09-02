import assert from 'node:assert/strict';
import test from 'node:test';

import { createInstanceStorageKey } from './storage-key.ts';

test('isolates the same storage name by instance ID', () => {
  const first = createInstanceStorageKey('instance-a', 'session');
  const second = createInstanceStorageKey('instance-b', 'session');

  assert.notEqual(first, second);
});

test('creates SecureStore-compatible keys', () => {
  const key = createInstanceStorageKey('neta.example/tr', 'auth.session');

  assert.match(key, /^[A-Za-z0-9._-]+$/);
});

test('rejects blank scope values', () => {
  assert.throws(() => createInstanceStorageKey(' ', 'session'));
  assert.throws(() => createInstanceStorageKey('instance-a', ' '));
});
