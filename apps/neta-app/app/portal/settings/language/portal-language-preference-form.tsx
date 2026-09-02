"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Check, Globe2, RotateCcw, Save } from "lucide-react";
import { Badge, Button, Card, CardContent, Label, RadioGroup, RadioGroupItem } from "poyraz-ui/atoms";
import { Alert, AlertDescription, AlertTitle, toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import {
  resetPortalLanguagePreferenceAction,
  savePortalLanguagePreferenceAction,
} from "./actions";

type LocaleOption = {
  code: string;
  name: string;
  nativeName: string;
};

export function PortalLanguagePreferenceForm({
  activeLocales,
  assignedLanguage,
  initialLanguage,
  preferenceNeedsSelection,
}: {
  activeLocales: LocaleOption[];
  assignedLanguage: string;
  initialLanguage: string;
  preferenceNeedsSelection: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [language, setLanguage] = useState(initialLanguage);
  const [pending, startTransition] = useTransition();
  const assignedLocale = activeLocales.find((locale) => locale.code === assignedLanguage);

  function submit() {
    startTransition(async () => {
      const result = await savePortalLanguagePreferenceAction(language);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.languagePreference.messages.saved"));
      router.refresh();
    });
  }

  function reset() {
    startTransition(async () => {
      const result = await resetPortalLanguagePreferenceAction();
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      setLanguage(result.language ?? assignedLanguage);
      toast.success(t("settings.portal.language.messages.reset"));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-foreground">
            {t("settings.portal.language.title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("settings.portal.language.description")}
          </p>
        </div>

        <Alert>
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t("settings.portal.language.assigned.title")}</AlertTitle>
          <AlertDescription>
            {assignedLocale
              ? t("settings.portal.language.assigned.value", {
                language: assignedLocale.nativeName,
                code: assignedLocale.code,
              })
              : assignedLanguage}
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
              htmlFor={`portal-language-${locale.code}`}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <RadioGroupItem id={`portal-language-${locale.code}`} value={locale.code} />
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
              {assignedLanguage === locale.code && (
                <Badge variant="secondary">
                  {t("settings.portal.language.assigned.badge")}
                </Badge>
              )}
            </Label>
          ))}
        </RadioGroup>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            effect="shine"
            loading={pending}
            disabled={language === assignedLanguage}
            onClick={reset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("settings.portal.language.actions.reset")}
          </Button>
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
