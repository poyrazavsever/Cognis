import { requireFreelancerBackend } from "@/server/web/freelancer";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, type ContentTranslationRow } from "@/server/i18n/content";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { SubscriptionsClient, type SubscriptionRow } from "./subscriptions-client";

export default async function SubscriptionsPage() {
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getLocalizationContext(actor);
  const rawSubscriptions = service.listSubscriptions(actor);
  const translations = content.listBatch("subscription", rawSubscriptions.map((subscription) => subscription.id));
  const subscriptions: SubscriptionRow[] = rawSubscriptions.map((subscription) => {
    const translationRows = translations.get(subscription.id) ?? [];
    const resolved = content.resolveEntity("subscription", subscription, {
      locale: locale.locale,
      defaultLocale: localization.defaultLocale,
      translations: translationRows,
    });

    return {
      id: subscription.id,
      name: resolved.name,
      amount: subscription.amountMinor / 100,
      currency: subscription.currency,
      billing_cycle: subscription.billingCycle,
      status: subscription.status,
      category: resolved.category,
      next_billing_date: subscription.nextBillingDate,
      created_at: subscription.createdAt.toISOString(),
      translations: toLocalizedValues(translationRows),
    };
  });
  const i18nPayload = getClientI18nPayload(locale.locale, ["business", "common"]);

  return (
    <I18nProvider {...i18nPayload}>
      <SubscriptionsClient subscriptions={subscriptions} localization={localization} />
    </I18nProvider>
  );
}

function toLocalizedValues(rows: ContentTranslationRow[]) {
  return rows.reduce<Record<string, Record<string, string>>>((result, row) => {
    result[row.locale] = result[row.locale] ?? {};
    result[row.locale][row.field] = row.value;
    return result;
  }, {});
}
