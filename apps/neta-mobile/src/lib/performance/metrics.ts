export type PerformanceMetric = 'cold-shell' | 'dashboard-data' | 'keyboard-open' | 'list-scroll-frame' | 'modal-open' | 'tab-switch' | 'warm-shell';
export type PerformanceSample = { durationMs: number; metric: PerformanceMetric; recordedAt: number };

export const PERFORMANCE_BUDGET_MS: Record<PerformanceMetric, number> = {
  'cold-shell': 3_000,
  'dashboard-data': 2_000,
  'keyboard-open': 400,
  'list-scroll-frame': 34,
  'modal-open': 500,
  'tab-switch': 350,
  'warm-shell': 1_200,
};

const samples: PerformanceSample[] = [];
const starts = new Map<PerformanceMetric, number>();
const scrollTimestamps = new Map<string, number>();

export function recordPerformanceSample(metric: PerformanceMetric, durationMs: number): PerformanceSample {
  const sample = { durationMs: Math.max(0, Math.round(durationMs)), metric, recordedAt: Date.now() };
  samples.push(sample);
  if (samples.length > 100) samples.shift();
  return sample;
}

export function isWithinPerformanceBudget(sample: Pick<PerformanceSample, 'durationMs' | 'metric'>): boolean {
  return sample.durationMs <= PERFORMANCE_BUDGET_MS[sample.metric];
}

export function readPerformanceSamples(): readonly PerformanceSample[] {
  return [...samples];
}

export function markPerformanceStart(metric: PerformanceMetric, now = performance.now()): void {
  starts.set(metric, now);
}

export function finishPerformanceMeasure(metric: PerformanceMetric, now = performance.now()): PerformanceSample | null {
  const startedAt = starts.get(metric);
  if (startedAt === undefined) return null;
  starts.delete(metric);
  return recordPerformanceSample(metric, now - startedAt);
}

export function recordScrollFrame(key: string, timestamp: number): PerformanceSample | null {
  const previous = scrollTimestamps.get(key);
  scrollTimestamps.set(key, timestamp);
  if (previous === undefined) return null;
  const duration = timestamp - previous;
  if (duration <= 0 || duration > 250) return null;
  return recordPerformanceSample('list-scroll-frame', duration);
}
