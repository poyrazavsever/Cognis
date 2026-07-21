"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Input, Label, Textarea } from "poyraz-ui/atoms";
import { contentInputName, type ContentTranslationField } from "@/lib/i18n/content";

export type LocalizedFieldLocale = {
  code: string;
  nativeName: string;
  status?: string;
};

export type LocalizedFieldValues = Record<string, Record<string, string | null | undefined>>;

type LocalizedFieldsProps = {
  idPrefix: string;
  defaultLocale: string;
  locales: LocalizedFieldLocale[];
  fields: ContentTranslationField[];
  values?: LocalizedFieldValues | null;
  fallbackValues?: Record<string, string | null | undefined>;
  labels?: {
    defaultBadge?: string;
    missingRequired?: string;
  };
};

export function LocalizedFields({
  idPrefix,
  defaultLocale,
  locales,
  fields,
  values,
  fallbackValues,
  labels,
}: LocalizedFieldsProps) {
  const orderedLocales = useMemo(() => {
    const localeMap = new Map(locales.map((locale) => [locale.code, locale]));
    const defaultLocaleRecord = localeMap.get(defaultLocale);
    return [
      ...(defaultLocaleRecord ? [defaultLocaleRecord] : []),
      ...locales.filter((locale) => locale.code !== defaultLocale),
    ];
  }, [defaultLocale, locales]);
  const [activeLocale, setActiveLocale] = useState(orderedLocales[0]?.code ?? defaultLocale);
  const missingRequiredLocales = new Set(
    orderedLocales
      .filter((locale) =>
        fields.some((field) => {
          if (!field.required) return false;
          const value = values?.[locale.code]?.[field.name] ?? (
            locale.code === defaultLocale ? fallbackValues?.[field.name] : null
          );
          return !String(value ?? "").trim();
        }),
      )
      .map((locale) => locale.code),
  );

  return (
    <div className="grid gap-4 rounded-sm border border-border bg-muted/10 p-3">
      <div className="tiny-scrollbar flex gap-2 overflow-x-auto pb-1">
        {orderedLocales.map((locale) => (
          <Button
            key={locale.code}
            type="button"
            variant={activeLocale === locale.code ? "default" : "secondary"}
            effect="shine"
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => setActiveLocale(locale.code)}
          >
            {locale.nativeName || locale.code}
            {locale.code === defaultLocale ? (
              <Badge variant="secondary">{labels?.defaultBadge ?? "Default"}</Badge>
            ) : null}
            {missingRequiredLocales.has(locale.code) ? (
              <span
                aria-label={labels?.missingRequired}
                aria-hidden={labels?.missingRequired ? undefined : true}
                className="text-amber-500"
              >
                •
              </span>
            ) : null}
          </Button>
        ))}
      </div>

      {orderedLocales.map((locale) => (
        <div key={locale.code} className={activeLocale === locale.code ? "grid gap-4" : "hidden"}>
          {fields.map((field) => {
            const id = `${idPrefix}-${locale.code}-${field.name}`;
            const defaultValue =
              values?.[locale.code]?.[field.name] ??
              (locale.code === defaultLocale ? fallbackValues?.[field.name] : "") ??
              "";

            return (
              <div key={field.name} className="grid gap-2">
                <Label htmlFor={id}>
                  {field.label}
                  {field.required && locale.code === defaultLocale ? <span className="text-destructive"> *</span> : null}
                </Label>
                {field.kind === "textarea" ? (
                  <Textarea
                    id={id}
                    name={contentInputName(locale.code, field.name)}
                    defaultValue={String(defaultValue ?? "")}
                    maxLength={field.maxLength}
                    required={field.required && locale.code === defaultLocale}
                    placeholder={field.placeholder}
                    rows={field.name === "content" ? 8 : 3}
                  />
                ) : (
                  <Input
                    id={id}
                    name={contentInputName(locale.code, field.name)}
                    defaultValue={String(defaultValue ?? "")}
                    maxLength={field.maxLength}
                    required={field.required && locale.code === defaultLocale}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
