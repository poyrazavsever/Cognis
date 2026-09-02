import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocalizedPayload, findMissingLocalizedLocales } from './localized-form.ts';

test('builds the shared localized payload and reports missing active locale tabs', () => {
  const translations = buildLocalizedPayload('project', 'tr', { description: null, name: ' Neta ' });
  assert.equal(translations.tr?.name, 'Neta');
  assert.deepEqual(findMissingLocalizedLocales('project', ['tr', 'en'], translations), ['en']);
});
