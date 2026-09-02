import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDashboardValue, formatMoney } from './format.ts';

test('formats money as localized currency', () => {
  const formatted = formatMoney({ amountMinor: 123456, currency: 'TRY' }, 'tr-TR');

  assert.match(formatted, /₺|TRY/);
  assert.match(formatMoney({ amountMinor: 1250, currency: 'JPY' }, 'ja-JP'), /1,250|1\.250/);
});

test('formats primitive dashboard values', () => {
  assert.equal(formatDashboardValue('Aktif', 'tr-TR'), 'Aktif');
  assert.equal(formatDashboardValue(1200, 'tr-TR'), '1.200');
});
