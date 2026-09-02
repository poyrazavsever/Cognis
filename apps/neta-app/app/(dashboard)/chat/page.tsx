import { I18nProvider } from "@/components/i18n/i18n-provider";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { AIChatClient } from "./chat-client";

export default async function AIChatPage() {
  const { context } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const i18nPayload = getClientI18nPayload(locale.locale, ["chat", "common"]);

  return (
    <I18nProvider {...i18nPayload}>
      <AIChatClient locale={locale.locale} />
    </I18nProvider>
  );
}
