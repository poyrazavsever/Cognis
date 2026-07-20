"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, Card, CardContent } from "poyraz-ui/atoms";

export default function SettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <CardContent className="space-y-4 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">
          {t("settings.shell.errorTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("settings.shell.errorDescription")}
        </p>
        <Button effect="shine" variant="default" onClick={reset}>
          {t("settings.shell.retry")}
        </Button>
      </CardContent>
    </Card>
  );
}
