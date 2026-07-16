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

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const setupState = await getFirstFreelancerSetupState();

  if (setupState.errorMessage) {
    redirect(`/login?error=true&message=${encodeURIComponent(setupState.errorMessage)}`);
  }

  if (!setupState.available) {
    redirect(
      `/login?error=true&message=${encodeURIComponent(
        "Kayıt kapalı. Bu Neta kurulumunda ilk admin hesabı zaten oluşturulmuş.",
      )}`,
    );
  }

  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;
  const message = resolvedParams?.message;
  const branding = getPublicBranding();

  return (
    <>
      {error && message && <ErrorToaster message={String(message)} />}
      <AuthPageShell
        branding={{
          applicationName: branding.applicationName,
          lightLogoUrl: branding.lightLogoUrl,
          darkLogoUrl: branding.darkLogoUrl,
        }}
        title="İlk admin hesabını oluştur"
        description="Bu Neta çalışma alanının ilk yönetici hesabını oluştur."
        form={
          <form className="space-y-6">
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
                <Label htmlFor="password" className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                  Şifre
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

            <SubmitButton formAction={signup} className="h-11 w-full gap-2" pendingText="Oluşturuluyor...">
              <UserPlus className="h-4 w-4" />
              Admin hesabını oluştur
            </SubmitButton>
          </form>
        }
        secondaryAction={null}
        footer={
          <div className="text-center text-sm">
            Zaten hesabın var mı?{" "}
            <Link
              href="/login"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Giriş yap
            </Link>
          </div>
        }
      />
    </>
  );
}
