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

export const dynamic = "force-dynamic";

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { token } = await params;
  const invitation = getPortalInvitationPreview(token);
  const branding = getPublicBranding();

  if (!invitation) {
    notFound();
  }

  const query = await searchParams;
  const isUsable = invitation.status === "pending";
  const unavailableMessage =
    invitation.status === "expired"
      ? "Bu davetin süresi dolmuş. Freelancer'dan yeni bir bağlantı istemelisin."
      : invitation.status === "accepted"
        ? "Bu davet daha önce kullanılmış. Hesabınla giriş yapabilirsin."
        : invitation.status === "revoked"
          ? "Bu davet iptal edilmiş. Freelancer'dan yeni bir bağlantı istemelisin."
          : null;

  return (
    <>
      {query.error && query.message ? <ErrorToaster message={query.message} /> : null}
      <AuthPageShell
        branding={{
          applicationName: branding.organizationName ?? branding.applicationName,
          lightLogoUrl: branding.lightLogoUrl,
          darkLogoUrl: branding.darkLogoUrl,
        }}
        title="Müşteri portalına katıl"
        description="Davet edilen hesabın için adını ve şifreni belirle."
        form={
          isUsable ? (
            <form className="space-y-6">
              <input type="hidden" name="token" value={token} />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    E-posta
                  </Label>
                  <Input id="email" type="email" value={invitation.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    Ad soyad
                  </Label>
                  <Input id="displayName" name="displayName" required maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                    Şifre
                  </Label>
                  <Input id="password" name="password" type="password" required minLength={8} maxLength={128} />
                  <p className="text-xs text-muted-foreground">En az 8 karakter kullan.</p>
                </div>
              </div>
              <SubmitButton size="lg" formAction={acceptInvitation} className="w-full" pendingText="Hesap oluşturuluyor...">
                Portal hesabını oluştur
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
            Giriş sayfasına dön
          </Link>
        }
      />
    </>
  );
}
