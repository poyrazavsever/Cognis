import { interpolateMessage } from "./format";
import type { TranslationValues } from "./types";

export type Translator = {
  locale: string;
  messages: Record<string, string>;
  t: (key: string, values?: TranslationValues) => string;
};

export function createTranslatorFromMessages(
  locale: string,
  messages: Record<string, string>,
): Translator {
  return {
    locale,
    messages,
    t(key, values) {
      const message = messages[key] ?? key;
      return interpolateMessage(message, values, locale);
    },
  };
}
