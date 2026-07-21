"use client";

import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { CheckCircle2, Download, FileEdit, MoreHorizontal, Plus, Send, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardContent } from "poyraz-ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "poyraz-ui/molecules";

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string | null;
  due_date: string | null;
  clientName: string | null;
  projectName: string | null;
  created_at: string;
};

export function InvoicesClient({ invoices }: { invoices: InvoiceRow[] }) {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("business.invoices.title")}</h1>
        <Button variant="default" effect="shine" className="gap-2">
          <Plus className="h-4 w-4" /> {t("business.invoices.actions.add")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-sm border border-border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border transition-colors hover:bg-muted/50">
                    <TableHead>{t("business.invoices.table.number")}</TableHead>
                    <TableHead>{t("business.common.client")}</TableHead>
                    <TableHead>{t("business.common.amount")}</TableHead>
                    <TableHead>{t("business.common.status")}</TableHead>
                    <TableHead>{t("business.invoices.table.issueDate")}</TableHead>
                    <TableHead>{t("business.invoices.table.dueDate")}</TableHead>
                    <TableHead className="text-right">{t("business.common.actions")}</TableHead>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center text-muted-foreground">
                        {t("business.invoices.empty")}
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium text-foreground">
                          {invoice.invoice_number}
                          {invoice.projectName ? (
                            <div className="mt-0.5 text-xs font-normal text-muted-foreground">{invoice.projectName}</div>
                          ) : null}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">{invoice.clientName || "-"}</td>
                        <td className="p-4 align-middle font-medium">{formatCurrency(invoice.amount, invoice.currency)}</td>
                        <td className="p-4 align-middle"><InvoiceStatusBadge status={invoice.status} /></td>
                        <td className="p-4 align-middle text-muted-foreground">{invoice.issue_date ? formatDate(invoice.issue_date) : "-"}</td>
                        <td className="p-4 align-middle text-muted-foreground">{invoice.due_date ? formatDate(invoice.due_date) : "-"}</td>
                        <td className="p-4 align-middle text-right">
                          <InvoiceMenu />
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

function InvoiceMenu() {
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
        <DropdownMenuItem className="cursor-pointer">
          <FileEdit className="mr-2 h-4 w-4" /> {t("business.common.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" /> {t("business.invoices.actions.download")}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Send className="mr-2 h-4 w-4" /> {t("business.invoices.actions.send")}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-emerald-500 focus:text-emerald-500">
          <CheckCircle2 className="mr-2 h-4 w-4" /> {t("business.invoices.actions.markPaid")}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> {t("business.common.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceRow["status"] }) {
  const t = useTranslations();
  if (status === "draft") return <Badge variant="secondary">{t("business.invoices.status.draft")}</Badge>;
  if (status === "sent") return <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-500">{t("business.invoices.status.sent")}</Badge>;
  if (status === "paid") return <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">{t("business.invoices.status.paid")}</Badge>;
  if (status === "overdue") return <Badge variant="destructive">{t("business.invoices.status.overdue")}</Badge>;
  return <Badge variant="outline" className="opacity-70">{t("business.invoices.status.cancelled")}</Badge>;
}

function TableHead({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${className}`}>{children}</th>;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(getDocumentIntlLocale(), { style: "currency", currency }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}
