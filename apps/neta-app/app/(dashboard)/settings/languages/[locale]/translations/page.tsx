import { notFound } from "next/navigation";
import { getSqliteConnection } from "@/server/db/client";
import { I18nService, getReferenceTranslationKeys } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { TranslationEditor } from "./translation-editor";
import { I18N_NAMESPACES } from "@/lib/i18n";

export default async function TranslationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const localeCode = resolvedParams.locale;
  const { actor } = await requireFreelancerBackend();
  const service = new I18nService(getSqliteConnection().db);
  
  let locale;
  try {
    locale = service.listLocales(actor).find(l => l.code === localeCode);
    if (!locale) notFound();
  } catch {
    notFound();
  }

  const keys = getReferenceTranslationKeys("all");
  const currentTranslations = service.listUiTranslations(actor).filter(t => t.locale === localeCode);
  
  const overrides = new Map(currentTranslations.map(t => [`${t.namespace}.${t.key}`, t.value]));

  return (
    <TranslationEditor
      locale={{
        code: locale.code,
        name: locale.name,
        nativeName: locale.nativeName,
      }}
      namespaces={I18N_NAMESPACES}
      referenceKeys={keys}
      overrides={Object.fromEntries(overrides)}
    />
  );
}
