import { LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acceptInvitation } from "./actions";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { ErrorToaster } from "@/components/error-toaster";
import { Input, Label } from "poyraz-ui/atoms";
import { Alert, AlertDescription } from "poyraz-ui/molecules";
import { getPortalInvitationPreview } from "@/server/auth/invitations";
import { getPublicBranding } from "@/server/branding/runtime";
import { resolveInvitationLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";

export const dynamic = "force-dynamic";

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; code?: string; message?: string }>;
}) {
  const { token } = await params;
  const invitation = getPortalInvitationPreview(token);
  const branding = getPublicBranding();

  if (!invitation) {
    notFound();
  }

  const resolvedLocale = await resolveInvitationLocale(invitation.locale);
  const t = createTranslator(resolvedLocale.locale, ["auth"]).t;
  const query = await searchParams;
  const queryCode = query.code ?? null;
  const queryMessage = queryCode ? t(queryCode) : query.message;
  const resolvedQueryMessage = queryMessage === queryCode ? query.message : queryMessage;
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
  const isUsable = invitation.status === "pending";
  const unavailableMessage =
    invitation.status === "expired"
      ? t("auth.invite.expired")
      : invitation.status === "accepted"
        ? t("auth.invite.accepted")
        : invitation.status === "revoked"
          ? t("auth.invite.revoked")
          : null;

  return (
    <>
      {query.error && resolvedQueryMessage ? <ErrorToaster message={resolvedQueryMessage} /> : null}
      <AuthPageShell
        branding={{
          applicationName: branding.organizationName ?? branding.applicationName,
          lightLogoUrl: branding.lightLogoUrl,
          darkLogoUrl: branding.darkLogoUrl,
        }}
        title={t("auth.invite.title")}
        description={t("auth.invite.description")}
        marketing={marketing}
        form={
          isUsable ? (
            <form className="space-y-6">
              <input type="hidden" name="token" value={token} />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t("auth.invite.email")}
                  </Label>
                  <Input id="email" type="email" value={invitation.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    {t("auth.invite.displayName")}
                  </Label>
                  <Input id="displayName" name="displayName" required maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                    {t("auth.invite.password")}
                  </Label>
                  <Input id="password" name="password" type="password" required minLength={8} maxLength={128} />
                  <p className="text-xs text-muted-foreground">{t("auth.invite.passwordHelp")}</p>
                </div>
              </div>
              <SubmitButton size="lg" formAction={acceptInvitation} className="w-full" pendingText={t("auth.invite.pending")}>
                {t("auth.invite.submit")}
              </SubmitButton>
            </form>
          ) : (
            <Alert variant="warning" appearance="soft">
              <AlertDescription>{unavailableMessage}</AlertDescription>
            </Alert>
          )
        }
        secondaryAction={null}
        footer={
          <Link href="/login" className="text-sm font-medium text-primary hover:text-primary-hover">
            {t("auth.invite.backToLogin")}
          </Link>
        }
      />
    </>
  );
}
