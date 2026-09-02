import { notFound } from "next/navigation";
import { getSqliteConnection } from "@/server/db/client";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { LanguageDetail } from "./language-detail";

export default async function LanguageDetailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { actor } = await requireFreelancerBackend();
  const { locale: localeCode } = await params;
  const service = new I18nService(getSqliteConnection().db);
  const locales = service.listLocales(actor);
  const locale = locales.find((item) => item.code === localeCode);
  if (!locale) notFound();

  const completion = service
    .getCompletion(actor)
    .find((item) => item.locale === locale.code)?.percent ?? 0;

  return (
    <LanguageDetail
      locale={locale}
      defaultLocale={service.getSettings(actor).defaultLocale}
      completion={completion}
      namespaceCompletion={service.getNamespaceCompletion(actor, locale.code)}
      readiness={service.getLocaleReadiness(actor, locale.code)}
      usage={service.getLocaleUsage(actor, locale.code)}
      fallbackOptions={locales
        .filter(
          (item) => item.code !== locale.code && item.status !== "archived",
        )
        .map(({ code, nativeName }) => ({ code, nativeName }))}
    />
  );
}
