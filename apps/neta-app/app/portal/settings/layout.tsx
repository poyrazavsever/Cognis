import { PageHeader } from "@/components/system/page-header";
import { resolvePortalLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import { requirePortalBackend } from "@/server/web/portal";
import { PortalSettingsNavigation } from "./settings-navigation";

export default async function PortalSettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { context } = await requirePortalBackend();
  const locale = await resolvePortalLocale(context);
  const t = createTranslator(locale.locale, ["settings"]).t;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title={t("settings.portal.title")} />
      <div className="flex min-w-0 flex-col gap-8 md:flex-row md:items-start">
        <PortalSettingsNavigation
          labels={{
            language: t("settings.navigation.language"),
            appearance: t("settings.navigation.appearance"),
            profile: t("settings.navigation.profile"),
            security: t("settings.navigation.security"),
          }}
        />
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
