import { login } from "@/app/login/actions";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ErrorToaster } from "@/components/error-toaster";
import { LockKeyhole, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { Input, Label } from "poyraz-ui/atoms";
import { Alert, AlertDescription } from "poyraz-ui/molecules";
import { SubmitButton } from "@/components/auth/submit-button";
import { getPublicBranding } from "@/server/branding/runtime";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;
  const message = resolvedParams?.message;
  const branding = getPublicBranding();

  return (
    <>
      {error && message && <ErrorToaster message={String(message)} />}
      <AuthPageShell
        branding={{
          applicationName: branding.organizationName ?? branding.applicationName,
          lightLogoUrl: branding.lightLogoUrl,
          darkLogoUrl: branding.darkLogoUrl,
        }}
        title="Giriş yap"
        description="Neta çalışma alanına erişmek için hesabına giriş yap."
        form={
          <form className="space-y-6">
            {!error && message ? (
              <Alert variant="success" appearance="soft">
                <AlertDescription>{String(message)}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  E-posta
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ornek@mail.com"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                    Şifre
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                  >
                    Şifremi unuttum
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

            <SubmitButton size="lg" formAction={login} className="w-full gap-2" pendingText="Giriş yapılıyor...">
              <LogIn className="h-4 w-4" />
              Giriş yap
            </SubmitButton>
          </form>
        }
        secondaryAction={null}
        footer={
          <div className="text-center text-sm">
            İlk kurulumu yapmadın mı?{" "}
            <Link
              href="/register"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Admin hesabını oluştur
            </Link>
          </div>
        }
      />
    </>
  );
}
