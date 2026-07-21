"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, Card, CardContent } from "poyraz-ui/atoms";
import Link from "next/link";

export default function SettingsNotFound() {
  const { t } = useI18n();

  return (
    <Card>
      <CardContent className="space-y-4 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">
          {t("settings.shell.notFoundTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("settings.shell.notFoundDescription")}
        </p>
        <Button asChild effect="shine" variant="default">
          <Link href="/settings/general">{t("settings.shell.backToGeneral")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
