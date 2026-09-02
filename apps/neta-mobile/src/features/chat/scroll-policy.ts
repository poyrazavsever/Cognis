export type ScrollMetrics = { contentHeight: number; offsetY: number; viewportHeight: number };

export function isNearChatEnd(metrics: ScrollMetrics, threshold = 96): boolean {
  return metrics.contentHeight - metrics.viewportHeight - metrics.offsetY <= threshold;
}
