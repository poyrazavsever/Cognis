import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { getPublicBranding } from "@/server/branding/runtime";
import { resolvePublicLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import Link from "next/link";
import { Alert, AlertDescription } from "poyraz-ui/molecules";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const branding = getPublicBranding();
  const locale = await resolvePublicLocale();
  const t = createTranslator(locale.locale, ["auth"]).t;

  return (
    <AuthPageShell
      branding={{
        applicationName: branding.organizationName ?? branding.applicationName,
        lightLogoUrl: branding.lightLogoUrl,
        darkLogoUrl: branding.darkLogoUrl,
      }}
      title={t("auth.reset.title")}
      description={t("auth.reset.description")}
      marketing={{
        headline: t("auth.marketing.headline"),
        description: t("auth.marketing.description", { app: branding.organizationName ?? branding.applicationName }),
        openSource: t("auth.marketing.openSource"),
        github: t("auth.marketing.github"),
        via: t("auth.marketing.via"),
        builtBy: t("auth.marketing.builtBy"),
        highlights: [
          t("auth.highlights.clients"),
          t("auth.highlights.calendar"),
          t("auth.highlights.finance"),
          t("auth.highlights.reports"),
        ] as [string, string, string, string],
      }}
      form={
        <div className="space-y-6">
          <Alert variant="info" appearance="soft">
            <AlertDescription>{t("auth.reset.description")}</AlertDescription>
          </Alert>
        </div>
      }
      secondaryAction={null}
      footer={
        <Link href="/login" className="block text-center text-sm font-medium text-primary hover:text-primary-hover">
          {t("auth.forgot.back")}
        </Link>
      }
    />
  );
}
