import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createVisibleMonthDays,
  createVisibleMonthRange,
  isValidEventRange,
  moveMonth,
  toDateKey,
  toLocalCalendarKey,
} from './date.ts';

test('creates a six-week Monday based visible month range', () => {
  const range = createVisibleMonthRange(new Date(2026, 7, 15, 12));
  const from = new Date(`${range.from}T12:00:00`);
  const to = new Date(`${range.to}T12:00:00`);

  assert.equal(from.getDay(), 1);
  assert.equal((to.getTime() - from.getTime()) / 86_400_000, 42);
  assert.equal(createVisibleMonthDays(new Date(2026, 7, 15)).length, 42);
  assert.equal(toLocalCalendarKey(new Date(2026, 7, 2, 12)), '2026-08-02');
});

test('moves month without carrying an invalid day', () => {
  assert.equal(moveMonth(new Date(2026, 0, 31), 1).getMonth(), 1);
});

test('creates timezone-aware date keys around UTC midnight', () => {
  assert.equal(toDateKey('2026-08-01T22:30:00.000Z', 'Europe/Istanbul'), '2026-08-02');
});

test('keeps calendar date keys correct across a DST transition', () => {
  assert.equal(toDateKey('2026-03-08T04:30:00.000Z', 'America/New_York'), '2026-03-07');
  assert.equal(toDateKey('2026-03-08T05:30:00.000Z', 'America/New_York'), '2026-03-08');
});

test('requires event end after start', () => {
  const start = new Date('2026-08-01T10:00:00Z');
  assert.equal(isValidEventRange(start, new Date('2026-08-01T11:00:00Z')), true);
  assert.equal(isValidEventRange(start, start), false);
});
