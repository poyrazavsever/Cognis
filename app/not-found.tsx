import { getPublicBranding } from "@/server/branding/runtime";
import { resolveRootLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import Link from "next/link";
import { Button, Typography } from "poyraz-ui/atoms";

export default async function NotFoundPage() {
  const locale = await resolveRootLocale();
  const t = createTranslator(locale.locale, ["common"]).t;
  const branding = getPublicBranding();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="mx-auto max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
          404
        </div>
        <div className="space-y-2">
          <Typography component="h1" variant="h1" className="text-3xl font-semibold">
            {t("common.notFound.title")}
          </Typography>
          <Typography component="p" variant="muted" className="leading-6">
            {t("common.notFound.description")}
          </Typography>
        </div>
        <Button effect="shine" asChild>
          <Link href="/" aria-label={`${branding.applicationName}: ${t("common.notFound.backHome")}`}>
            {t("common.notFound.backHome")}
          </Link>
        </Button>
      </section>
    </main>
  );
}
