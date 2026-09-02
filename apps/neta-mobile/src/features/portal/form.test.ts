import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRevisionRequest, validateRevisionRequest } from './form.ts';

test('requires useful revision text and a source locale', () => {
  assert.deepEqual(validateRevisionRequest('kısa', 'not a locale'), {
    description: 'Revizyon açıklaması en az 10 karakter olmalıdır.',
    sourceLocale: 'Geçerli bir kaynak dil seç.',
  });
});

test('trims revision text and always sends sourceLocale', () => {
  assert.deepEqual(buildRevisionRequest('  Başlık daha büyük olmalı.  ', 'tr'), {
    description: 'Başlık daha büyük olmalı.',
    sourceLocale: 'tr',
  });
});
