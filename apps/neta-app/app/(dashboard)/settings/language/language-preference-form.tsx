"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Check, Globe2, Save } from "lucide-react";
import { Badge, Button, Card, CardContent, Label, RadioGroup, RadioGroupItem } from "poyraz-ui/atoms";
import { Alert, AlertDescription, AlertTitle, toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { saveLanguagePreferenceAction } from "./actions";

type LocaleOption = {
  code: string;
  name: string;
  nativeName: string;
};

export function LanguagePreferenceForm({
  activeLocales,
  defaultLocale,
  initialLanguage,
  preferenceNeedsSelection,
}: {
  activeLocales: LocaleOption[];
  defaultLocale: string;
  initialLanguage: string;
  preferenceNeedsSelection: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [language, setLanguage] = useState(initialLanguage);
  const [pending, startTransition] = useTransition();
  const defaultLanguage = activeLocales.find((locale) => locale.code === defaultLocale);

  function submit() {
    startTransition(async () => {
      const result = await saveLanguagePreferenceAction(language);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.languagePreference.messages.saved"));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-foreground">
            {t("settings.languagePreference.title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("settings.languagePreference.description")}
          </p>
        </div>

        <Alert>
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t("settings.languagePreference.default.title")}</AlertTitle>
          <AlertDescription>
            {defaultLanguage
              ? t("settings.languagePreference.default.value", {
                language: defaultLanguage.nativeName,
                code: defaultLanguage.code,
              })
              : defaultLocale}
          </AlertDescription>
        </Alert>

        {preferenceNeedsSelection && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>{t("settings.languagePreference.fallback.title")}</AlertTitle>
            <AlertDescription>
              {t("settings.languagePreference.fallback.description")}
            </AlertDescription>
          </Alert>
        )}

        <RadioGroup
          value={language}
          onValueChange={setLanguage}
          className="grid gap-3 sm:grid-cols-2"
          aria-label={t("settings.languagePreference.listAriaLabel")}
        >
          {activeLocales.map((locale) => (
            <Label
              key={locale.code}
              htmlFor={`language-${locale.code}`}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <RadioGroupItem id={`language-${locale.code}`} value={locale.code} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">
                  {locale.nativeName}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {locale.name} · {locale.code}
                </span>
              </span>
              {language === locale.code && (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
              {defaultLocale === locale.code && (
                <Badge variant="secondary">
                  {t("settings.languagePreference.default.badge")}
                </Badge>
              )}
            </Label>
          ))}
        </RadioGroup>

        <div className="flex justify-end border-t border-border pt-6">
          <Button
            type="button"
            variant="default"
            effect="shine"
            loading={pending}
            disabled={!language}
            onClick={submit}
            className="gap-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {t("settings.languagePreference.actions.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
