import type { JournalEntryListItem } from '@neta/api-contracts';

export type JournalTrendMetric = { average: number | null; delta: number | null };
export type JournalTrend = {
  energy: JournalTrendMetric;
  mood: JournalTrendMetric;
  satisfaction: JournalTrendMetric;
};

type ScoreKey = 'energy' | 'mood' | 'satisfaction';

export function calculateJournalTrend(items: readonly JournalEntryListItem[]): JournalTrend {
  const sorted = [...items].sort((left, right) => left.date.localeCompare(right.date));
  const midpoint = Math.ceil(sorted.length / 2);
  const earlier = sorted.slice(0, midpoint);
  const recent = sorted.slice(midpoint);

  return {
    energy: metric(sorted, earlier, recent, 'energy'),
    mood: metric(sorted, earlier, recent, 'mood'),
    satisfaction: metric(sorted, earlier, recent, 'satisfaction'),
  };
}

function metric(all: readonly JournalEntryListItem[], earlier: readonly JournalEntryListItem[], recent: readonly JournalEntryListItem[], key: ScoreKey): JournalTrendMetric {
  const average = mean(all, key);
  const earlierAverage = mean(earlier, key);
  const recentAverage = mean(recent, key);
  return { average, delta: earlierAverage === null || recentAverage === null ? null : round(recentAverage - earlierAverage) };
}

function mean(items: readonly JournalEntryListItem[], key: ScoreKey): number | null {
  const values = items.flatMap((item) => item[key] === null ? [] : [item[key]]);
  if (!values.length) return null;
  return round(values.reduce((total, value) => total + value, 0) / values.length);
}

function round(value: number): number { return Math.round(value * 10) / 10; }
