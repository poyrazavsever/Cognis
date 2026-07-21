import { PageHeader } from "@/components/system/page-header";
import { requireFreelancer } from "@/server/auth/session";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import { SettingsNavigation } from "./settings-navigation";

export default async function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await requireFreelancer();
  const locale = await resolveFreelancerLocale(context);
  const t = createTranslator(locale.locale, ["settings"]).t;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title={t("settings.title")} />
      <div className="flex min-w-0 flex-col gap-8 md:flex-row md:items-start">
        <SettingsNavigation
          labels={{
            general: t("settings.navigation.general"),
            appearance: t("settings.navigation.appearance"),
            profile: t("settings.navigation.profile"),
            security: t("settings.navigation.security"),
            ai: t("settings.navigation.ai"),
            language: t("settings.navigation.language"),
            languages: t("settings.navigation.languages"),
          }}
        />
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
