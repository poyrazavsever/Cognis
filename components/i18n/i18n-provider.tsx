"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  createTranslatorFromMessages,
  type Translator,
  type TranslationValues,
} from "@/lib/i18n";

type I18nContextValue = Translator;

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale?: string;
  messages: Record<string, string>;
}) {
  const parentValue = useContext(I18nContext);

  const value = useMemo(() => {
    const finalLocale = locale ?? parentValue?.locale ?? "en";
    const mergedMessages = parentValue ? { ...parentValue.messages, ...messages } : messages;
    return createTranslatorFromMessages(finalLocale, mergedMessages);
  }, [locale, messages, parentValue]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslations() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useTranslations must be used within I18nProvider.");
  }

  return (key: string, values?: TranslationValues) => value.t(key, values);
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within I18nProvider.");
  }
  return value;
}
