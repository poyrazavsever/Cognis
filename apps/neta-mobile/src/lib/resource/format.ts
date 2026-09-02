import type { MoneyAmount } from '@neta/api-contracts';

export function formatDashboardValue(value: number | MoneyAmount | string, locale: string): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat(locale).format(value);
  }

  return formatMoney(value, locale);
}

export function formatMoney(value: MoneyAmount, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    currency: value.currency,
    style: 'currency',
  });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(value.amountMinor / 10 ** fractionDigits);
}

export function formatDateTime(value: string, locale: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
