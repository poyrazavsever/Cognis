"use client";

import { useRef, useTransition } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { Button, Card, CardContent, Input, Label } from "poyraz-ui/atoms";
import { Alert, AlertDescription, AlertTitle, toast } from "poyraz-ui/molecules";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { changePasswordAction } from "./actions";

export function SecuritySettingsForm() {
  const t = useTranslations();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result.errorKey) {
        toast.error(t(result.errorKey));
        return;
      }
      formRef.current?.reset();
      toast.success(t("settings.security.messages.saved"));
    });
  }

  return (
    <Card>
      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-foreground">
            {t("settings.security.title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("settings.security.description")}
          </p>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t("settings.security.sessions.title")}</AlertTitle>
          <AlertDescription>
            {t("settings.security.sessions.description")}
          </AlertDescription>
        </Alert>

        <form ref={formRef} action={submit} className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              {t("settings.security.fields.currentPassword")}
            </Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t("settings.security.fields.newPassword")}
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("settings.security.fields.confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("settings.security.help.password")}
          </p>

          <div className="flex justify-end border-t border-border pt-6">
            <Button
              type="submit"
              variant="default"
              effect="shine"
              loading={pending}
              className="gap-2"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {t("settings.security.actions.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
