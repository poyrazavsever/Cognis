import assert from 'node:assert/strict';
import test from 'node:test';

import { NetaClientError } from '../api/errors.ts';
import { normalizeNetaOrigin } from './domain.ts';

test('normalizes a bare production domain to https origin', () => {
  const normalized = normalizeNetaOrigin('neta.example.com', { environment: 'production' });

  assert.equal(normalized.origin, 'https://neta.example.com');
  assert.equal(normalized.isLocalDevelopment, false);
});

test('rejects paths, query strings, fragments and credentials', () => {
  assert.throws(() => normalizeNetaOrigin('https://neta.example.com/app'), NetaClientError);
  assert.throws(() => normalizeNetaOrigin('https://neta.example.com?x=1'), NetaClientError);
  assert.throws(() => normalizeNetaOrigin('https://neta.example.com#x'), NetaClientError);
  assert.throws(() => normalizeNetaOrigin('https://user:neta@neta.example.com'), NetaClientError);
});

test('rejects remote http in production', () => {
  assert.throws(
    () => normalizeNetaOrigin('http://neta.example.com', { environment: 'production' }),
    /Production build HTTP/,
  );
});

test('allows local http in development', () => {
  const normalized = normalizeNetaOrigin('http://10.0.2.2:3000', { environment: 'development' });

  assert.equal(normalized.origin, 'http://10.0.2.2:3000');
  assert.equal(normalized.isLocalDevelopment, true);
});
