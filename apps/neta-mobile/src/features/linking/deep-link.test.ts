import assert from 'node:assert/strict';
import test from 'node:test';

import { createPasswordResetFallback } from './deep-link.ts';

test('creates password reset URL only for secure or loopback configured origins', () => {
  assert.equal(createPasswordResetFallback('https://neta.example'), 'https://neta.example/forgot-password');
  assert.equal(createPasswordResetFallback('http://localhost:3000'), 'http://localhost:3000/forgot-password');
  assert.equal(createPasswordResetFallback('http://neta.example'), null);
});
