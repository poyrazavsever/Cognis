"use client";

import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { useState } from "react";
import { format } from "date-fns";
import { getDocumentDateFnsLocale } from "@/lib/i18n/date-fns";
import { Plus, MoreHorizontal, FileEdit, Trash2, Mail, CheckCircle2, XCircle } from "lucide-react";
import { Button, Card, CardContent, Badge } from "poyraz-ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "poyraz-ui/molecules";

export type ProposalRow = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  valid_until: string | null;
  clientName: string | null;
  projectName: string | null;
  created_at: string;
};

export function ProposalsClient({ proposals }: { proposals: ProposalRow[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(getDocumentIntlLocale(), { style: "currency", currency }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Taslak</Badge>;
      case "sent":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">Gönderildi</Badge>;
      case "accepted":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">Kabul Edildi</Badge>;
      case "rejected":
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Teklifler</h1>
        </div>
        <Button variant="default" effect="shine" onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Yeni Teklif
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border border-border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Teklif Adı</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Müşteri</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tutar</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Geçerlilik</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {proposals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center text-muted-foreground">
                        Henüz hiç teklif bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    proposals.map((proposal) => (
                      <tr key={proposal.id} className="border-b border-border transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium text-foreground">
                          {proposal.title}
                          {proposal.projectName && (
                            <div className="text-xs text-muted-foreground font-normal mt-0.5">{proposal.projectName}</div>
                          )}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {proposal.clientName || "-"}
                        </td>
                        <td className="p-4 align-middle font-medium">
                          {formatCurrency(proposal.amount, proposal.currency)}
                        </td>
                        <td className="p-4 align-middle">
                          {getStatusBadge(proposal.status)}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {proposal.valid_until ? format(new Date(proposal.valid_until), "dd MMM yyyy", { locale: getDocumentDateFnsLocale() }) : "-"}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon-sm" effect="shine" variant="secondary" >
                                <span className="sr-only">Menüyü aç</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="cursor-pointer">
                                <FileEdit className="mr-2 h-4 w-4" /> Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Mail className="mr-2 h-4 w-4" /> Gönder
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-emerald-500 focus:text-emerald-500">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Kabul Edildi
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                <XCircle className="mr-2 h-4 w-4" /> Reddedildi
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      
      {/* Add Modal Placeholder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 text-foreground">Yeni Teklif Ekle</h3>
              <p className="text-sm text-muted-foreground mb-6">Bu özellik şu an geliştirme aşamasındadır.</p>
              <div className="flex justify-end">
                <Button effect="shine" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Kapat</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
