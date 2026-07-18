import { requireFreelancerBackend } from "@/server/web/freelancer";
import { SubscriptionsClient, type SubscriptionRow } from "./subscriptions-client";

export default async function SubscriptionsPage() {
  const { actor, service } = await requireFreelancerBackend();
  const subscriptions: SubscriptionRow[] = service.listSubscriptions(actor).map((subscription) => ({
    id: subscription.id,
    name: subscription.name,
    amount: subscription.amountMinor / 100,
    currency: subscription.currency,
    billing_cycle: subscription.billingCycle,
    status: subscription.status,
    category: subscription.category,
    next_billing_date: subscription.nextBillingDate,
    created_at: subscription.createdAt.toISOString(),
  }));

  return <SubscriptionsClient subscriptions={subscriptions} />;
}
