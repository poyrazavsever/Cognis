import type { TextDirection } from "../../lib/i18n";
import {
  directionForLocale as inferDirectionForLocale,
  normalizeLocaleCode,
} from "../../lib/i18n/locale-resolution";

export const DEFAULT_TEXT_DIRECTION: TextDirection = "ltr";

export { normalizeLocaleCode };

export function directionForLocale(locale: string, explicit?: TextDirection | null): TextDirection {
  if (explicit) return explicit;
  return inferDirectionForLocale(locale) ?? DEFAULT_TEXT_DIRECTION;
}
