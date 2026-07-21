"use client";

import { LocalizedFields, type LocalizedFieldLocale, type LocalizedFieldValues } from "@/components/i18n/localized-fields";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { contentTranslationRegistry } from "@/lib/i18n/content";
import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { createProposalRecord, deleteProposalRecord, updateProposalRecord } from "./actions";
import { CheckCircle2, FileEdit, Mail, MoreHorizontal, Plus, Trash2, XCircle } from "lucide-react";
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

export type BusinessRelationOption = {
  id: string;
  name: string;
  client_id?: string | null;
};

export type ProposalRow = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  valid_until: string | null;
  client_id: string | null;
  project_id: string | null;
  clientName: string | null;
  projectName: string | null;
  created_at: string;
  translations?: LocalizedFieldValues;
};

type ProposalsClientProps = {
  proposals: ProposalRow[];
  clients: BusinessRelationOption[];
  projects: BusinessRelationOption[];
  localization: {
    defaultLocale: string;
    locales: LocalizedFieldLocale[];
  };
};

const proposalStatuses = ["draft", "sent", "accepted", "rejected"] as const;
const currencyOptions = ["TRY", "USD", "EUR", "GBP"] as const;

export function ProposalsClient({ proposals, clients, projects, localization }: ProposalsClientProps) {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("business.proposals.title")}</h1>
        <ProposalDialog mode="create" clients={clients} projects={projects} localization={localization} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-sm border border-border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border transition-colors hover:bg-muted/50">
                    <TableHead>{t("business.proposals.table.title")}</TableHead>
                    <TableHead>{t("business.common.client")}</TableHead>
                    <TableHead>{t("business.common.amount")}</TableHead>
                    <TableHead>{t("business.common.status")}</TableHead>
                    <TableHead>{t("business.proposals.table.validUntil")}</TableHead>
                    <TableHead className="text-right">{t("business.common.actions")}</TableHead>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {proposals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-32 text-center text-muted-foreground">
                        {t("business.proposals.empty")}
                      </td>
                    </tr>
                  ) : (
                    proposals.map((proposal) => (
                      <tr key={proposal.id} className="border-b border-border transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium text-foreground">
                          {proposal.title}
                          {proposal.projectName ? (
                            <div className="mt-0.5 text-xs font-normal text-muted-foreground">{proposal.projectName}</div>
                          ) : null}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">{proposal.clientName || "-"}</td>
                        <td className="p-4 align-middle font-medium">{formatCurrency(proposal.amount, proposal.currency)}</td>
                        <td className="p-4 align-middle"><ProposalStatusBadge status={proposal.status} /></td>
                        <td className="p-4 align-middle text-muted-foreground">{proposal.valid_until ? formatDate(proposal.valid_until) : "-"}</td>
                        <td className="p-4 align-middle text-right">
                          <ProposalMenu proposal={proposal} clients={clients} projects={projects} localization={localization} />
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

function ProposalMenu({ proposal, clients, projects, localization }: {
  proposal: ProposalRow;
  clients: BusinessRelationOption[];
  projects: BusinessRelationOption[];
  localization: ProposalsClientProps["localization"];
}) {
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
        <ProposalDialog mode="edit" proposal={proposal} clients={clients} projects={projects} localization={localization} trigger="menu" />
        <DropdownMenuItem className="cursor-pointer">
          <Mail className="mr-2 h-4 w-4" /> {t("business.proposals.actions.send")}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-emerald-500 focus:text-emerald-500">
          <CheckCircle2 className="mr-2 h-4 w-4" /> {t("business.proposals.status.accepted")}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
          <XCircle className="mr-2 h-4 w-4" /> {t("business.proposals.status.rejected")}
        </DropdownMenuItem>
        <form action={deleteProposalRecord}>
          <input type="hidden" name="id" value={proposal.id} />
          <button type="submit" className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> {t("business.common.delete")}
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProposalDialog({ mode, proposal, clients, projects, localization, trigger = "button" }: {
  mode: "create" | "edit";
  proposal?: ProposalRow;
  clients: BusinessRelationOption[];
  projects: BusinessRelationOption[];
  localization: ProposalsClientProps["localization"];
  trigger?: "button" | "menu";
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = mode === "create" ? createProposalRecord : updateProposalRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      await action(formData);
      setOpen(false);
      toast.success(t(mode === "create" ? "business.proposals.messages.created" : "business.proposals.messages.updated"));
    } catch (error) {
      toast.error(resolveTranslatedError(t, error, "business.proposals.errors.saveFailed"));
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
            <Plus className="h-4 w-4" /> {t("business.proposals.actions.add")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(720px,calc(100dvh-4rem))] sm:max-w-2xl">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {proposal ? <input type="hidden" name="id" value={proposal.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>{t(mode === "create" ? "business.proposals.form.createTitle" : "business.proposals.form.editTitle")}</DialogTitle>
            <DialogDescription>{t("business.proposals.form.description")}</DialogDescription>
          </DialogHeader>
          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <div className="grid gap-4">
              <LocalizedFields
                idPrefix={`proposal-${proposal?.id || "new"}`}
                defaultLocale={localization.defaultLocale}
                locales={localization.locales}
                fields={contentTranslationRegistry.proposal.map((field) => ({
                  ...field,
                  label: t(`business.proposals.fields.${field.name}`),
                  placeholder: "placeholder" in field && typeof field.placeholder === "string"
                    ? t(`business.proposals.placeholders.${field.name}`)
                    : undefined,
                }))}
                values={proposal?.translations}
                fallbackValues={{ title: proposal?.title, description: proposal?.description }}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField name="client_id" label={t("business.common.client")} defaultValue={proposal?.client_id || "__none"}>
                  <SelectItem value="__none">{t("business.common.none")}</SelectItem>
                  {clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                </SelectField>
                <SelectField name="project_id" label={t("business.common.project")} defaultValue={proposal?.project_id || "__none"}>
                  <SelectItem value="__none">{t("business.common.none")}</SelectItem>
                  {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
                </SelectField>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <Field label={t("business.common.amount")}><Input name="amount" type="number" min="0" step="0.01" required defaultValue={proposal?.amount ?? ""} /></Field>
                <SelectField name="currency" label={t("business.common.currency")} defaultValue={proposal?.currency || "TRY"}>
                  {currencyOptions.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
                </SelectField>
                <SelectField name="status" label={t("business.common.status")} defaultValue={proposal?.status || "draft"}>
                  {proposalStatuses.map((status) => <SelectItem key={status} value={status}>{t(`business.proposals.status.${status}`)}</SelectItem>)}
                </SelectField>
                <Field label={t("business.proposals.fields.validUntil")}><Input name="valid_until" type="date" defaultValue={proposal?.valid_until?.slice(0, 10) ?? ""} /></Field>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t("business.common.saving") : t(mode === "create" ? "business.proposals.form.submitCreate" : "business.proposals.form.submitEdit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProposalStatusBadge({ status }: { status: ProposalRow["status"] }) {
  const t = useTranslations();
  if (status === "draft") return <Badge variant="secondary">{t("business.proposals.status.draft")}</Badge>;
  if (status === "sent") return <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-500">{t("business.proposals.status.sent")}</Badge>;
  if (status === "accepted") return <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">{t("business.proposals.status.accepted")}</Badge>;
  return <Badge variant="destructive">{t("business.proposals.status.rejected")}</Badge>;
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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(getDocumentIntlLocale(), { style: "currency", currency }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function resolveTranslatedError(t: ReturnType<typeof useTranslations>, error: unknown, fallbackKey: string) {
  if (!(error instanceof Error)) return t(fallbackKey);
  if (/^business\./.test(error.message)) return t(error.message);
  return error.message || t(fallbackKey);
}
