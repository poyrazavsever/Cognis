import { login } from "@/app/login/actions";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ErrorToaster } from "@/components/error-toaster";
import { LockKeyhole, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { Input, Label } from "poyraz-ui/atoms";
import { Alert, AlertDescription } from "poyraz-ui/molecules";
import { SubmitButton } from "@/components/auth/submit-button";
import { getPublicBranding } from "@/server/branding/runtime";
import { resolvePublicLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import type { TranslationValues } from "@/lib/i18n";

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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
        title={t("auth.login.title")}
        description={t("auth.login.description")}
        marketing={marketing}
        form={
          <form className="space-y-6">
            {!error && message ? (
              <Alert variant="success" appearance="soft">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
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
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                    {t("auth.login.password")}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                  >
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-11"
                />
              </div>
            </div>

            <SubmitButton size="lg" formAction={login} className="w-full gap-2" pendingText={t("auth.login.pending")}>
              <LogIn className="h-4 w-4" />
              {t("auth.login.submit")}
            </SubmitButton>
          </form>
        }
        secondaryAction={null}
        footer={
          <div className="text-center text-sm">
            {t("auth.login.setupPrompt")}{" "}
            <Link
              href="/register"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              {t("auth.login.createAdmin")}
            </Link>
          </div>
        }
      />
    </>
  );
}
