import { Card, CardContent } from "poyraz-ui/atoms";
import { createTranslator } from "@/server/i18n/translator";
import { resolvePortalLocale } from "@/server/i18n/resolver";
import { requirePortalBackend } from "@/server/web/portal";

export default async function PortalProfileSettingsPage() {
  const { context } = await requirePortalBackend();
  const locale = await resolvePortalLocale(context);
  const t = createTranslator(locale.locale, ["settings"]).t;

  return (
    <Card>
      <CardContent className="space-y-2 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          {t("settings.portal.profile.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("settings.portal.profile.description")}
        </p>
      </CardContent>
    </Card>
  );
}
