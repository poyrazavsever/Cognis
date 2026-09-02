import assert from 'node:assert/strict';
import test from 'node:test';

import { currencyFractionDigits, formatMinorAmountForInput, parseMajorAmountToMinor } from './money.ts';

test('converts localized major amounts without floating point arithmetic', () => {
  assert.equal(parseMajorAmountToMinor('1.234,56', 'TRY', 'tr-TR'), 123456);
  assert.equal(parseMajorAmountToMinor('1,234.56', 'USD', 'en-US'), 123456);
  assert.equal(parseMajorAmountToMinor('1250', 'JPY', 'ja-JP'), 1250);
});

test('rejects excess precision, invalid currency and unsafe amounts', () => {
  assert.equal(parseMajorAmountToMinor('1,001', 'TRY', 'tr-TR'), null);
  assert.equal(parseMajorAmountToMinor('999999999999999999', 'USD', 'en-US'), null);
  assert.equal(currencyFractionDigits('invalid'), null);
});

test('formats minor units for editing with currency-specific precision', () => {
  assert.equal(formatMinorAmountForInput(123456, 'TRY', 'tr-TR'), '1234,56');
  assert.equal(formatMinorAmountForInput(1250, 'JPY', 'ja-JP'), '1250');
});
