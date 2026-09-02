import assert from 'node:assert/strict';
import test from 'node:test';
import type { JournalEntryListItem } from '@neta/api-contracts';
import { calculateJournalTrend } from './trend.ts';

function entry(date: string, mood: JournalEntryListItem['mood'], energy: JournalEntryListItem['energy'], satisfaction: JournalEntryListItem['satisfaction']): JournalEntryListItem {
  return { date, energy, id: date, mood, moodLabel: 'Test', satisfaction, updatedAt: `${date}T12:00:00.000Z` };
}

test('calculates journal averages and recent-half direction without private note content', () => {
  const trend = calculateJournalTrend([entry('2026-07-04', 5, 4, null), entry('2026-07-01', 2, 2, 2), entry('2026-07-03', 4, 4, 4), entry('2026-07-02', 3, null, 3)]);
  assert.deepEqual(trend.mood, { average: 3.5, delta: 2 });
  assert.deepEqual(trend.energy, { average: 3.3, delta: 2 });
  assert.deepEqual(trend.satisfaction, { average: 3, delta: 1.5 });
});

test('returns neutral trend data when the range is empty or cannot be compared', () => {
  assert.deepEqual(calculateJournalTrend([]).mood, { average: null, delta: null });
  assert.deepEqual(calculateJournalTrend([entry('2026-07-01', 3, 3, 3)]).mood, { average: 3, delta: null });
});
