"use client";

import { useState, useTransition } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button, Card, CardContent, Label, RadioGroup, RadioGroupItem } from "poyraz-ui/atoms";
import { toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { applyColorMode } from "@/components/theme/color-mode-sync";
import { isColorMode, type ColorMode } from "@/lib/color-mode";
import { savePortalColorModeAction } from "./actions";

const themeOptions = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

export function PortalAppearanceForm({
  initialColorMode,
}: {
  initialColorMode: ColorMode;
}) {
  const t = useTranslations();
  const [colorMode, setColorMode] = useState(initialColorMode);
  const [pending, startTransition] = useTransition();

  function changeColorMode(value: string) {
    if (!isColorMode(value) || value === colorMode || pending) return;
    const previous = colorMode;
    setColorMode(value);
    applyColorMode(value);
    startTransition(async () => {
      const result = await savePortalColorModeAction(value);
      if (result.errorKey) {
        setColorMode(previous);
        applyColorMode(previous);
        toast.error(t(result.errorKey));
        return;
      }
      toast.success(t("settings.appearance.messages.themeSaved"));
    });
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-foreground">
            {t("settings.portal.appearance.title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("settings.portal.appearance.description")}
          </p>
        </div>

        <RadioGroup
          value={colorMode}
          onValueChange={changeColorMode}
          disabled={pending}
          aria-label={t("settings.appearance.theme.ariaLabel")}
          className="grid gap-3 sm:grid-cols-3"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;

            const selected = colorMode === option.value;

            return (
              <Label
                key={option.value}
                htmlFor={`portal-color-mode-${option.value}`}
                className={`flex min-h-36 cursor-pointer flex-col justify-between gap-5 rounded-md border p-4 transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <RadioGroupItem
                    id={`portal-color-mode-${option.value}`}
                    value={option.value}
                    aria-label={t(`settings.appearance.theme.${option.value}.label`)}
                  />
                </div>
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {t(`settings.appearance.theme.${option.value}.label`)}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {t(`settings.appearance.theme.${option.value}.description`)}
                  </span>
                </span>
              </Label>
            );
          })}
        </RadioGroup>

        <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          {t("settings.portal.appearance.brandingNotice")}
        </div>

        <div className="flex justify-end border-t border-border pt-6">
          <Button type="button" variant="secondary" effect="shine" loading={pending} disabled>
            {t("settings.portal.appearance.autoSave")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
