import assert from 'node:assert/strict';
import test from 'node:test';

import { compareSemver, isSupportedApiVersion } from './version.ts';

test('compares semver values', () => {
  assert.equal(compareSemver('0.1.0', '0.1.0'), 0);
  assert.ok(compareSemver('0.2.0', '0.1.9') > 0);
  assert.ok(compareSemver('0.1.0', '0.2.0') < 0);
});

test('treats partial and invalid versions defensively', () => {
  assert.equal(compareSemver('1', '1.0.0'), 0);
  assert.ok(compareSemver('bad', '0.0.1') < 0);
});

test('accepts API v1 and rejects incompatible or ambiguous versions', () => {
  assert.equal(isSupportedApiVersion('v1'), true);
  assert.equal(isSupportedApiVersion('1.2.0'), true);
  assert.equal(isSupportedApiVersion('v2'), false);
  assert.equal(isSupportedApiVersion('latest'), false);
  assert.equal(isSupportedApiVersion('1-preview'), false);
});
