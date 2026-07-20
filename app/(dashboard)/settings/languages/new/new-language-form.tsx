"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Languages, Save } from "lucide-react";
import { Button, Card, CardContent, Input, Label, RadioGroup, RadioGroupItem } from "poyraz-ui/atoms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { createLanguageAction } from "./actions";

type FallbackOption = {
  code: string;
  nativeName: string;
};

export function NewLanguageForm({
  defaultFallback,
  fallbackOptions,
}: {
  defaultFallback: string;
  fallbackOptions: FallbackOption[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [fallbackLocale, setFallbackLocale] = useState(defaultFallback);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    formData.set("fallbackLocale", fallbackLocale);
    startTransition(async () => {
      const result = await createLanguageAction(formData);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.languageNew.messages.created"));
      router.push(`/settings/languages/${encodeURIComponent(result.locale ?? "")}`);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Button asChild size="icon-sm" variant="secondary" effect="shine">
            <Link href="/settings/languages" aria-label={t("settings.languageNew.actions.back")}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-foreground">
              {t("settings.languageNew.title")}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("settings.languageNew.description")}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Languages className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{t("settings.languageNew.draftNotice")}</p>
          </div>
        </div>

        <form action={submit} className="max-w-2xl space-y-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="locale-code">{t("settings.languageNew.fields.code")}</Label>
              <Input
                id="locale-code"
                name="code"
                placeholder={t("settings.languageNew.placeholders.code")}
                maxLength={12}
                autoCapitalize="none"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.languageNew.help.code")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-name">{t("settings.languageNew.fields.name")}</Label>
              <Input
                id="language-name"
                name="name"
                placeholder={t("settings.languageNew.placeholders.name")}
                maxLength={80}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="native-name">{t("settings.languageNew.fields.nativeName")}</Label>
            <Input
              id="native-name"
              name="nativeName"
              placeholder={t("settings.languageNew.placeholders.nativeName")}
              maxLength={80}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.languageNew.help.nativeName")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("settings.languageNew.fields.fallback")}</Label>
              <Select value={fallbackLocale} onValueChange={setFallbackLocale}>
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.languageNew.placeholders.fallback")} />
                </SelectTrigger>
                <SelectContent>
                  {fallbackOptions.map((locale) => (
                    <SelectItem key={locale.code} value={locale.code}>
                      {locale.nativeName} ({locale.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("settings.languageNew.help.fallback")}
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">
                {t("settings.languageNew.fields.direction")}
              </legend>
              <RadioGroup
                name="textDirection"
                defaultValue="ltr"
                className="grid grid-cols-2 gap-2"
              >
                {(["ltr", "rtl"] as const).map((direction) => (
                  <Label
                    key={direction}
                    htmlFor={`direction-${direction}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3"
                  >
                    <RadioGroupItem id={`direction-${direction}`} value={direction} />
                    {t(`settings.languageNew.direction.${direction}`)}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>
          </div>

          <div className="flex justify-end border-t border-border pt-6">
            <Button
              type="submit"
              variant="default"
              effect="shine"
              loading={pending}
              className="gap-2"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {t("settings.languageNew.actions.create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
