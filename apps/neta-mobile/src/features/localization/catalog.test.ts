import assert from 'node:assert/strict';
import test from 'node:test';

import { catalogKeysMatch, isRtlLocale, resolveMessage } from './catalog.ts';
import { parseCatalogFile } from './catalog-file.ts';

test('keeps bundled Turkish and English mobile keys at parity', () => assert.equal(catalogKeysMatch(), true));
test('uses remote catalog then bundled locale fallback without showing raw keys', () => {
  assert.equal(resolveMessage('mobile-common.save', 'en', { 'mobile-common.save': 'Store' }), 'Store');
  assert.equal(resolveMessage('mobile-common.save', 'en', null), 'Save');
});
test('validates imported translation catalog', () => {
  assert.equal(parseCatalogFile('{"locale":"tr","version":2,"messages":{"mobile-common.save":"Kaydet"}}').version, 2);
  assert.throws(() => parseCatalogFile('{bad'), /JSON/);
});
test('detects custom RTL locale direction', () => { assert.equal(isRtlLocale('ar-SA'), true); assert.equal(isRtlLocale('tr'), false); });
