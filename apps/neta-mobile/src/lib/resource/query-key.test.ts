import assert from 'node:assert/strict';
import test from 'node:test';

import { createQueryKey, serializeQueryKey } from './query-key.ts';

test('creates stable query keys independent of filter order', () => {
  const first = createQueryKey('instance-a', 'user-a', 'freelancer', 'tr', 'dashboard', {
    range: 'this_month',
    search: 'neta',
  });
  const second = createQueryKey('instance-a', 'user-a', 'freelancer', 'tr', 'dashboard', {
    search: 'neta',
    range: 'this_month',
  });

  assert.equal(serializeQueryKey(first), serializeQueryKey(second));
});

test('drops undefined filters from query keys', () => {
  const key = serializeQueryKey(
    createQueryKey('instance-a', 'user-a', 'freelancer', 'tr', 'projects', {
      status: undefined,
    }),
  );

  assert.doesNotMatch(key, /undefined/);
});

test('isolates cache keys for two users with the same role and instance', () => {
  const first = serializeQueryKey(createQueryKey('instance-a', 'user-a', 'client', 'tr', 'portal'));
  const second = serializeQueryKey(createQueryKey('instance-a', 'user-b', 'client', 'tr', 'portal'));
  assert.notEqual(first, second);
});
