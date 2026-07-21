"use client";

import { LocalizedFields, type LocalizedFieldLocale, type LocalizedFieldValues } from "@/components/i18n/localized-fields";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { contentTranslationRegistry } from "@/lib/i18n/content";
import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { createSubscriptionRecord, deleteSubscriptionRecord, updateSubscriptionRecord } from "./actions";
import { CreditCard, FileEdit, MoreHorizontal, Plus, RefreshCw, StopCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, CardContent, Input, Label } from "poyraz-ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "poyraz-ui/molecules";

export type SubscriptionRow = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: "monthly" | "yearly" | "weekly";
  status: "active" | "cancelled";
  category: string | null;
  next_billing_date: string | null;
  created_at: string;
  translations?: LocalizedFieldValues;
};

type SubscriptionsClientProps = {
  subscriptions: SubscriptionRow[];
  localization: {
    defaultLocale: string;
    locales: LocalizedFieldLocale[];
  };
};

const billingCycles = ["weekly", "monthly", "yearly"] as const;
const subscriptionStatuses = ["active", "cancelled"] as const;
const currencyOptions = ["TRY", "USD", "EUR", "GBP"] as const;

export function SubscriptionsClient({ subscriptions, localization }: SubscriptionsClientProps) {
  const t = useTranslations();
  const activeMonthlyTotal = subscriptions
    .filter((subscription) => subscription.status === "active")
    .reduce((total, subscription) => total + monthlyEquivalent(subscription), 0);

  return (
    <div className="flex w-full flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("business.subscriptions.title")}</h1>
        <SubscriptionDialog mode="create" localization={localization} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <CreditCard className="h-5 w-5" />
              <h3 className="font-semibold">{t("business.subscriptions.stats.monthlyTotal")}</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(activeMonthlyTotal, "TRY")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("business.subscriptions.stats.monthlyTotalDesc")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-sm border border-border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border transition-colors hover:bg-muted/50">
                    <TableHead>{t("business.subscriptions.table.name")}</TableHead>
                    <TableHead>{t("business.subscriptions.fields.category")}</TableHead>
                    <TableHead>{t("business.common.amount")}</TableHead>
                    <TableHead>{t("business.subscriptions.fields.billingCycle")}</TableHead>
                    <TableHead>{t("business.common.status")}</TableHead>
                    <TableHead>{t("business.subscriptions.fields.nextBillingDate")}</TableHead>
                    <TableHead className="text-right">{t("business.common.actions")}</TableHead>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center text-muted-foreground">
                        {t("business.subscriptions.empty")}
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((subscription) => (
                      <tr key={subscription.id} className={`border-b border-border transition-colors hover:bg-muted/50 ${subscription.status === "cancelled" ? "opacity-60" : ""}`}>
                        <td className="p-4 align-middle font-medium text-foreground">{subscription.name}</td>
                        <td className="p-4 align-middle text-muted-foreground">{subscription.category || "-"}</td>
                        <td className="p-4 align-middle font-medium">{formatCurrency(subscription.amount, subscription.currency)}</td>
                        <td className="p-4 align-middle text-muted-foreground">{t(`business.subscriptions.billingCycle.${subscription.billing_cycle}`)}</td>
                        <td className="p-4 align-middle"><SubscriptionStatusBadge status={subscription.status} /></td>
                        <td className="p-4 align-middle text-muted-foreground">{subscription.next_billing_date ? formatDate(subscription.next_billing_date) : "-"}</td>
                        <td className="p-4 align-middle text-right">
                          <SubscriptionMenu subscription={subscription} localization={localization} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionMenu({ subscription, localization }: { subscription: SubscriptionRow; localization: SubscriptionsClientProps["localization"] }) {
  const t = useTranslations();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" effect="shine" variant="secondary">
          <span className="sr-only">{t("business.common.openMenu")}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <SubscriptionDialog mode="edit" subscription={subscription} localization={localization} trigger="menu" />
        <DropdownMenuItem className={subscription.status === "active" ? "cursor-pointer text-amber-500 focus:text-amber-500" : "cursor-pointer text-emerald-500 focus:text-emerald-500"}>
          {subscription.status === "active" ? <StopCircle className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {subscription.status === "active" ? t("business.subscriptions.actions.cancel") : t("business.subscriptions.actions.reactivate")}
        </DropdownMenuItem>
        <form action={deleteSubscriptionRecord}>
          <input type="hidden" name="id" value={subscription.id} />
          <button type="submit" className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> {t("business.common.delete")}
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubscriptionDialog({ mode, subscription, localization, trigger = "button" }: {
  mode: "create" | "edit";
  subscription?: SubscriptionRow;
  localization: SubscriptionsClientProps["localization"];
  trigger?: "button" | "menu";
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = mode === "create" ? createSubscriptionRecord : updateSubscriptionRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      await action(formData);
      setOpen(false);
      toast.success(t(mode === "create" ? "business.subscriptions.messages.created" : "business.subscriptions.messages.updated"));
    } catch (error) {
      toast.error(resolveTranslatedError(t, error, "business.subscriptions.errors.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger === "menu" ? (
          <button type="button" className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm">
            <FileEdit className="mr-2 h-4 w-4" /> {t("business.common.edit")}
          </button>
        ) : (
          <Button variant="default" effect="shine" className="gap-2">
            <Plus className="h-4 w-4" /> {t("business.subscriptions.actions.add")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(720px,calc(100dvh-4rem))] sm:max-w-2xl">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {subscription ? <input type="hidden" name="id" value={subscription.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>{t(mode === "create" ? "business.subscriptions.form.createTitle" : "business.subscriptions.form.editTitle")}</DialogTitle>
            <DialogDescription>{t("business.subscriptions.form.description")}</DialogDescription>
          </DialogHeader>
          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <div className="grid gap-4">
              <LocalizedFields
                idPrefix={`subscription-${subscription?.id || "new"}`}
                defaultLocale={localization.defaultLocale}
                locales={localization.locales}
                fields={contentTranslationRegistry.subscription.map((field) => ({
                  ...field,
                  label: t(`business.subscriptions.fields.${field.name}`),
                  placeholder: "placeholder" in field && typeof field.placeholder === "string"
                    ? t(`business.subscriptions.placeholders.${field.name}`)
                    : undefined,
                }))}
                values={subscription?.translations}
                fallbackValues={{ name: subscription?.name, category: subscription?.category }}
              />
              <div className="grid gap-4 md:grid-cols-4">
                <Field label={t("business.common.amount")}><Input name="amount" type="number" min="0" step="0.01" required defaultValue={subscription?.amount ?? ""} /></Field>
                <SelectField name="currency" label={t("business.common.currency")} defaultValue={subscription?.currency || "TRY"}>
                  {currencyOptions.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
                </SelectField>
                <SelectField name="billing_cycle" label={t("business.subscriptions.fields.billingCycle")} defaultValue={subscription?.billing_cycle || "monthly"}>
                  {billingCycles.map((cycle) => <SelectItem key={cycle} value={cycle}>{t(`business.subscriptions.billingCycle.${cycle}`)}</SelectItem>)}
                </SelectField>
                <SelectField name="status" label={t("business.common.status")} defaultValue={subscription?.status || "active"}>
                  {subscriptionStatuses.map((status) => <SelectItem key={status} value={status}>{t(`business.subscriptions.status.${status}`)}</SelectItem>)}
                </SelectField>
              </div>
              <Field label={t("business.subscriptions.fields.nextBillingDate")}>
                <Input name="next_billing_date" type="date" defaultValue={subscription?.next_billing_date ?? ""} />
              </Field>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t("business.common.saving") : t(mode === "create" ? "business.subscriptions.form.submitCreate" : "business.subscriptions.form.submitEdit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionStatusBadge({ status }: { status: SubscriptionRow["status"] }) {
  const t = useTranslations();
  return status === "active"
    ? <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">{t("business.subscriptions.status.active")}</Badge>
    : <Badge variant="secondary">{t("business.subscriptions.status.cancelled")}</Badge>;
}

function TableHead({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${className}`}>{children}</th>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}

function SelectField({ name, label, defaultValue, children }: { name: string; label: string; defaultValue: string; children: React.ReactNode }) {
  return (
    <Field label={label}>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </Field>
  );
}

function monthlyEquivalent(subscription: SubscriptionRow) {
  if (subscription.billing_cycle === "yearly") return subscription.amount / 12;
  if (subscription.billing_cycle === "weekly") return subscription.amount * 4.33;
  return subscription.amount;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(getDocumentIntlLocale(), { style: "currency", currency }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function resolveTranslatedError(t: ReturnType<typeof useTranslations>, error: unknown, fallbackKey: string) {
  if (!(error instanceof Error)) return t(fallbackKey);
  if (/^business\./.test(error.message)) return t(error.message);
  return error.message || t(fallbackKey);
}
