import { getSqliteConnection } from "@/server/db/client";
import { I18nService } from "@/server/i18n/service";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { NewLanguageForm } from "./new-language-form";

export default async function NewLanguagePage() {
  const { actor } = await requireFreelancerBackend();
  const service = new I18nService(getSqliteConnection().db);
  const locales = service
    .listLocales(actor)
    .filter((locale) => locale.status !== "archived");
  const defaultLocale = service.getSettings(actor).defaultLocale;

  return (
    <NewLanguageForm
      defaultFallback={locales.some((locale) => locale.code === defaultLocale)
        ? defaultLocale
        : locales[0]?.code ?? "tr"}
      fallbackOptions={locales.map(({ code, nativeName }) => ({ code, nativeName }))}
    />
  );
}
