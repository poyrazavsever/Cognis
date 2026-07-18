import "server-only";

import { z } from "zod";

export const dashboardRangeSchema = z.enum([
  "today",
  "this_week",
  "this_month",
  "this_year",
]);

export type DashboardRange = z.infer<typeof dashboardRangeSchema>;

export function parseDashboardRange(
  value: string | string[] | undefined,
  fallback: DashboardRange = "this_month",
): DashboardRange {
  const parsed = dashboardRangeSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export function resolveDashboardRange(range: DashboardRange, now = new Date()) {
  let startAt: Date;
  let endAt: Date;

  if (range === "today") {
    startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (range === "this_week") {
    const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay();
    startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    endAt = new Date(startAt);
    endAt.setDate(endAt.getDate() + 6);
    endAt.setHours(23, 59, 59, 999);
  } else if (range === "this_year") {
    startAt = new Date(now.getFullYear(), 0, 1);
    endAt = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    startAt = new Date(now.getFullYear(), now.getMonth(), 1);
    endAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return {
    startAt,
    endAt,
    startDate: toBusinessDate(startAt),
    endDate: toBusinessDate(endAt),
  };
}

function toBusinessDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
