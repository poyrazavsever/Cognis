"use client";

import { useState, useTransition } from "react";
import { Label } from "poyraz-ui/atoms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "poyraz-ui/molecules";

type LocaleOption = {
  code: string;
  nativeName: string;
  name: string;
};

type LocaleSelectFormProps = {
  label: string;
  value: string;
  locales: LocaleOption[];
};

export function LocaleSelectForm({ label, value, locales }: LocaleSelectFormProps) {
  const [currentLocale, setCurrentLocale] = useState(value);
  const [pending, startTransition] = useTransition();

  function handleChange(locale: string) {
    setCurrentLocale(locale);
    startTransition(async () => {
      await fetch("/api/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      window.location.reload();
    });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="auth-locale">{label}</Label>
      <Select value={currentLocale} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger id="auth-locale" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>
              {locale.nativeName || locale.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
