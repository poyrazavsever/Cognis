import "server-only";

import { DomainError } from "../domain/errors";

export function cleanText(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text !== "__none" ? text : null;
}

export function requiredText(
  value: FormDataEntryValue | null,
  message: string,
): string {
  const text = cleanText(value);
  if (!text) throw new DomainError("VALIDATION_ERROR", message);
  return text;
}

export function optionalDate(value: FormDataEntryValue | null): Date | null {
  const text = cleanText(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new DomainError("VALIDATION_ERROR", "Geçerli bir tarih girilmelidir.");
  }
  return date;
}

export function decimalToMinor(value: FormDataEntryValue | null): number | null {
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : "";
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new DomainError("VALIDATION_ERROR", "Tutar sıfır veya daha büyük olmalıdır.");
  }
  return Math.round((amount + Number.EPSILON) * 100);
}

export function minorToDecimal(value: number | null | undefined): number | null {
  return value == null ? null : value / 100;
}

export function dateToIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}
