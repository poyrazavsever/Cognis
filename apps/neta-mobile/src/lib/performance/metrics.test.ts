import assert from 'node:assert/strict';
import test from 'node:test';

import { finishPerformanceMeasure, isWithinPerformanceBudget, markPerformanceStart, PERFORMANCE_BUDGET_MS, recordPerformanceSample, recordScrollFrame } from './metrics.ts';

test('evaluates cold, warm and dashboard performance budgets', () => {
  assert.equal(isWithinPerformanceBudget({ durationMs: PERFORMANCE_BUDGET_MS['warm-shell'], metric: 'warm-shell' }), true);
  assert.equal(isWithinPerformanceBudget({ durationMs: PERFORMANCE_BUDGET_MS['dashboard-data'] + 1, metric: 'dashboard-data' }), false);
  assert.equal(recordPerformanceSample('cold-shell', -4).durationMs, 0);
});

test('measures tab, modal and keyboard interactions without external telemetry', () => {
  markPerformanceStart('tab-switch', 100);
  assert.equal(finishPerformanceMeasure('tab-switch', 240)?.durationMs, 140);
  assert.equal(finishPerformanceMeasure('tab-switch', 300), null);
  markPerformanceStart('keyboard-open', 500);
  assert.equal(finishPerformanceMeasure('keyboard-open', 740)?.metric, 'keyboard-open');
});

test('samples active list frames and ignores pauses between gestures', () => {
  assert.equal(recordScrollFrame('chat', 100), null);
  assert.equal(recordScrollFrame('chat', 116)?.durationMs, 16);
  assert.equal(recordScrollFrame('chat', 900), null);
});
