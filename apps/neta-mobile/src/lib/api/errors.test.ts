import assert from 'node:assert/strict';
import test from 'node:test';

import { redactErrorMessage, upstreamErrorMessage } from './errors.ts';

test('redacts credentials from server errors', () => {
  const safe = redactErrorMessage('provider api_key=sk-private-value');
  assert.doesNotMatch(safe, /sk-private-value/);
  assert.equal(redactErrorMessage('Geçersiz istek.'), 'Geçersiz istek.');
  assert.doesNotMatch(redactErrorMessage('Authorization: Bearer private-value'), /private-value/);
  assert.doesNotMatch(redactErrorMessage('reset_token=private-reset'), /private-reset/);
  assert.doesNotMatch(redactErrorMessage('eyJhbGciOiJIUzI1NiJ9.payload.signature'), /payload/);
});

test('maps upstream errors without provider details', () => {
  assert.match(upstreamErrorMessage('UPSTREAM_TIMEOUT'), /zamanında/);
  assert.match(upstreamErrorMessage('SERVICE_UNAVAILABLE'), /yapılandırılmamış|kullanılamıyor/);
});
