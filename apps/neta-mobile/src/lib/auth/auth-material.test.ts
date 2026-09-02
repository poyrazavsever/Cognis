import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeBearerToken, normalizeSetCookieHeader } from './auth-material.ts';

test('extracts cookie pairs without replaying Set-Cookie attributes', () => {
  assert.equal(
    normalizeSetCookieHeader('better-auth.session_token=abc123; Path=/; HttpOnly; SameSite=Lax'),
    'better-auth.session_token=abc123',
  );
  assert.equal(
    normalizeSetCookieHeader('session=one; Path=/, csrf=two; Path=/; Secure'),
    'session=one; csrf=two',
  );
  assert.equal(normalizeSetCookieHeader('session=one\r\nX-Injected: true'), null);
});

test('accepts only bounded single-line bearer material', () => {
  assert.equal(normalizeBearerToken('0123456789abcdef'), '0123456789abcdef');
  assert.equal(normalizeBearerToken('short'), null);
  assert.equal(normalizeBearerToken('token with whitespace'), null);
});
