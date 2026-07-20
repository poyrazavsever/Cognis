import { signup } from "@/app/login/actions";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ErrorToaster } from "@/components/error-toaster";
import { getFirstFreelancerSetupState } from "@/server/auth/setup";
import { LockKeyhole, Mail, UserPlus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Input, Label } from "poyraz-ui/atoms";
import { SubmitButton } from "@/components/auth/submit-button";
import { getPublicBranding } from "@/server/branding/runtime";
import { resolvePublicLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import type { TranslationValues } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function resolveAuthMessage(
  code: string | null,
  fallback: string | null,
  t: (key: string, values?: TranslationValues) => string,
): string | null {
  if (!code) return fallback;
  const key = code.startsWith("auth.") ? code : `auth.${code}`;
  const message = t(key);
  return message === key ? fallback : message;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const setupState = await getFirstFreelancerSetupState();

  if (setupState.errorMessage) {
    redirect("/login?error=true&code=auth.messages.setupStateError");
  }

  if (!setupState.available) {
    redirect("/login?error=true&code=auth.messages.setupUnavailable");
  }

  const resolvedParams = await searchParams;
  const error = firstParam(resolvedParams?.error);
  const code = firstParam(resolvedParams?.code);
  const rawMessage = firstParam(resolvedParams?.message);
  const branding = getPublicBranding();
  const locale = await resolvePublicLocale();
  const t = createTranslator(locale.locale, ["auth"]).t;
  const message = resolveAuthMessage(code, rawMessage, t);
  const marketing = {
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
  };

  return (
    <>
      {error && message ? <ErrorToaster message={message} /> : null}
      <AuthPageShell
        branding={{
          applicationName: branding.organizationName ?? branding.applicationName,
          lightLogoUrl: branding.lightLogoUrl,
          darkLogoUrl: branding.darkLogoUrl,
        }}
        title={t("auth.register.firstAdminTitle")}
        description={t("auth.register.description")}
        marketing={marketing}
        form={
          <form className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {t("auth.login.email")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("auth.login.emailPlaceholder")}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                  {t("auth.login.password")}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-11"
                />
              </div>
            </div>

            <SubmitButton size="lg" formAction={signup} className="w-full gap-2" pendingText={t("auth.register.pending")}>
              <UserPlus className="h-4 w-4" />
              {t("auth.register.submit")}
            </SubmitButton>
          </form>
        }
        secondaryAction={null}
        footer={
          <div className="text-center text-sm">
            {t("auth.register.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              {t("auth.login.submit")}
            </Link>
          </div>
        }
      />
    </>
  );
}
