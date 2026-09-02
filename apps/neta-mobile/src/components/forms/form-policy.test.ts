import assert from 'node:assert/strict';
import test from 'node:test';

import { firstInvalidField } from './form-policy.ts';

test('selects the first invalid field in visual order', () => {
  assert.equal(firstInvalidField({ dueAt: 'Hatalı', title: 'Zorunlu' }, ['title', 'dueAt']), 'title');
  assert.equal(firstInvalidField({}, ['title', 'dueAt']), undefined);
});
