export type CalendarRange = {
  from: string;
  to: string;
};

export function createVisibleMonthRange(anchor: Date): CalendarRange {
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const from = new Date(firstDay);
  from.setDate(from.getDate() - mondayOffset);
  from.setHours(0, 0, 0, 0);

  const to = new Date(from);
  to.setDate(to.getDate() + 42);

  return { from: toLocalCalendarKey(from), to: toLocalCalendarKey(to) };
}

export function moveMonth(anchor: Date, amount: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + amount, 1, 12);
}

export function createVisibleMonthDays(anchor: Date): Date[] {
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  firstDay.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() + index);
    day.setHours(12, 0, 0, 0);
    return day;
  });
}

export function toLocalCalendarKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateKey(value: Date | string, timezone: string): string {
  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values['year'] ?? ''}-${values['month'] ?? ''}-${values['day'] ?? ''}`;
}

export function isValidEventRange(startAt: Date, endAt: Date): boolean {
  return !Number.isNaN(startAt.getTime()) && !Number.isNaN(endAt.getTime()) && endAt > startAt;
}
