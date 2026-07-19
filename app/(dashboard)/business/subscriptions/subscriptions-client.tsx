"use client";

import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { useState } from "react";
import { format } from "date-fns";
import { getDocumentDateFnsLocale } from "@/lib/i18n/date-fns";
import { CreditCard, Plus, MoreHorizontal, FileEdit, Trash2, StopCircle, RefreshCw } from "lucide-react";
import { Button, Card, CardContent, Badge } from "poyraz-ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
};

export function SubscriptionsClient({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(getDocumentIntlLocale(), { style: "currency", currency }).format(amount);
  };

  const getCycleBadge = (cycle: string) => {
    switch (cycle) {
      case "monthly":
        return "Aylık";
      case "yearly":
        return "Yıllık";
      case "weekly":
        return "Haftalık";
      default:
        return cycle;
    }
  };

  const activeMonthlyTotal = subscriptions
    .filter(s => s.status === "active")
    .reduce((acc, s) => {
      let monthlyEquivalent = s.amount;
      if (s.billing_cycle === "yearly") monthlyEquivalent = s.amount / 12;
      if (s.billing_cycle === "weekly") monthlyEquivalent = s.amount * 4.33;
      return acc + monthlyEquivalent;
    }, 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Abonelikler ve Masraflar</h1>
        </div>
        <Button variant="default" effect="shine" onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Yeni Abonelik
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CreditCard className="h-5 w-5" />
              <h3 className="font-semibold">Aylık Tahmini Gider</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(activeMonthlyTotal, "TRY")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Aktif aboneliklerin aylık ortalaması</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border border-border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Abonelik Adı</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kategori</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tutar</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Periyot</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Sonraki Ödeme</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-24 text-center text-muted-foreground">
                        Henüz hiç abonelik bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr key={sub.id} className={`border-b border-border transition-colors hover:bg-muted/50 ${sub.status === 'cancelled' ? 'opacity-50' : ''}`}>
                        <td className="p-4 align-middle font-medium text-foreground">
                          {sub.name}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground capitalize">
                          {sub.category || "-"}
                        </td>
                        <td className="p-4 align-middle font-medium">
                          {formatCurrency(sub.amount, sub.currency)}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {getCycleBadge(sub.billing_cycle)}
                        </td>
                        <td className="p-4 align-middle">
                          {sub.status === "active" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">Aktif</Badge>
                          ) : (
                            <Badge variant="secondary">İptal Edildi</Badge>
                          )}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {sub.next_billing_date ? format(new Date(sub.next_billing_date), "dd MMM yyyy", { locale: getDocumentDateFnsLocale() }) : "-"}
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
                              {sub.status === "active" ? (
                                <DropdownMenuItem className="cursor-pointer text-amber-500 focus:text-amber-500">
                                  <StopCircle className="mr-2 h-4 w-4" /> İptal Et
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="cursor-pointer text-emerald-500 focus:text-emerald-500">
                                  <RefreshCw className="mr-2 h-4 w-4" /> Yeniden Aktifleştir
                                </DropdownMenuItem>
                              )}
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
      
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 text-foreground">Yeni Abonelik Ekle</h3>
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
