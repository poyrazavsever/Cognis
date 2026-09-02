export function currencyFractionDigits(currency: string): number | null {
  try {
    return new Intl.NumberFormat('en', {
      currency: currency.toUpperCase(),
      style: 'currency',
    }).resolvedOptions().maximumFractionDigits ?? null;
  } catch {
    return null;
  }
}

export function parseMajorAmountToMinor(
  input: string,
  currency: string,
  locale: string,
): number | null {
  const fractionDigits = currencyFractionDigits(currency);
  if (fractionDigits === null) return null;

  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.';
  const group = parts.find((part) => part.type === 'group')?.value ?? ',';
  const compact = input.trim().replace(/[\s\u00A0\u202F]/g, '').replaceAll(group, '');
  const normalized = decimal === '.' ? compact : compact.replace(decimal, '.');
  const pattern = fractionDigits === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{1,${fractionDigits}})?$`);

  if (!pattern.test(normalized)) return null;
  const [whole = '', fraction = ''] = normalized.split('.');
  const scale = 10n ** BigInt(fractionDigits);
  const minor = BigInt(whole) * scale + BigInt(fraction.padEnd(fractionDigits, '0') || '0');

  return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
}

export function formatMinorAmountForInput(amountMinor: number, currency: string, locale: string): string {
  const fractionDigits = currencyFractionDigits(currency);
  if (fractionDigits === null || !Number.isSafeInteger(amountMinor)) return '';
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(amountMinor / 10 ** fractionDigits);
}
