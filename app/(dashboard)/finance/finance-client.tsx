"use client";

import {
  createFinanceTransactionRecord,
  deleteFinanceTransactionRecord,
  updateFinanceTransactionRecord,
} from "@/app/(dashboard)/finance/actions";
import { Badge, Button, Card, CardContent, Input, Label, Textarea } from "poyraz-ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "poyraz-ui/molecules";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  Brain,
  Loader2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { StatCard } from "@/components/system/stat-card";

export type FinanceRelationOption = {
  id: string;
  name: string;
  client_id?: string | null;
};

export type FinanceTransactionItem = {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  transaction_date: string;
  category: string | null;
  payment_status: "planned" | "pending" | "paid" | "cancelled";
  client_id: string | null;
  project_id: string | null;
  clientName: string | null;
  projectName: string | null;
  description: string | null;
};

const typeLabels = {
  income: "Gelir",
  expense: "Gider",
};

const paymentStatusLabels = {
  planned: "Planlandı",
  pending: "Bekliyor",
  paid: "Ödendi",
  cancelled: "İptal edildi",
};

const paymentStatusClasses = {
  planned: "border-blue-200 bg-blue-50 text-blue-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

const currencyOptions = [
  { value: "USD", label: "Dolar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "TRY", label: "Türk lirası (TRY)" },
  { value: "GBP", label: "Sterlin (GBP)" },
  { value: "CAD", label: "Kanada doları (CAD)" },
  { value: "AUD", label: "Avustralya doları (AUD)" },
];

// Dizilim ve featured alanı, özet şeridinde hangi metriklerin önce
// gösterileceğini tek bir yerden değiştirmeyi sağlar.
const financeSummaryCardConfig = [
  { key: "afterTax", label: "Vergi Sonrası Net", tone: "green", icon: Wallet, featured: true },
  { key: "net", label: "Brüt kazanç", tone: "primary", icon: Wallet, featured: true },
  { key: "income", label: "Aylık gelir", tone: "green", icon: ArrowUpRight, featured: false },
  { key: "expense", label: "Aylık gider", tone: "rose", icon: ArrowDownRight, featured: false },
  { key: "pending", label: "Bekleyen", tone: "amber", icon: Wallet, featured: false },
  { key: "tax", label: "KDV Tahmini (%20)", tone: "amber", icon: Wallet, featured: false },
] as const;

type FinanceClientProps = {
  transactions: FinanceTransactionItem[];
  clients: FinanceRelationOption[];
  projects: FinanceRelationOption[];
};

export function FinanceClient({ transactions, clients, projects }: FinanceClientProps) {
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const summaryTrackRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredByMonth = transactions.filter((transaction) =>
    transaction.transaction_date.startsWith(monthFilter),
  );
  const filteredTransactions = normalizedQuery
    ? filteredByMonth.filter((transaction) =>
        [
          transaction.description,
          transaction.category,
          transaction.clientName,
          transaction.projectName,
          typeLabels[transaction.type],
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
      )
    : filteredByMonth;

  const summary = useMemo(() => calculateSummary(filteredByMonth), [filteredByMonth]);
  const categoryBreakdown = useMemo(() => calculateExpenseCategories(filteredByMonth), [filteredByMonth]);
  const summaryCards = financeSummaryCardConfig.map((card) => ({
    ...card,
    value: formatCurrency(summary[card.key]),
  }));

  const scrollSummary = (direction: -1 | 1) => {
    const track = summaryTrackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.72, 260),
      behavior: "smooth",
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            Finans işlemleri
          </h1>
        </div>
        <div className="flex gap-2">
          <AIFinanceDialog />
          <FinanceDialog mode="create" clients={clients} projects={projects} />
        </div>
      </div>

      <section aria-labelledby="finance-summary-title" className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="finance-summary-title" className="text-base font-semibold text-foreground">
              Finans özeti
            </h2>
            <p className="text-sm text-muted-foreground">
              Öne çıkan metrikler önce gösterilir; diğer kartlar arasında kaydırarak ilerleyebilirsin.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              effect="shine"
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Önceki finans özet kartları"
              onClick={() => scrollSummary(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              effect="shine"
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Sonraki finans özet kartları"
              onClick={() => scrollSummary(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={summaryTrackRef}
          role="region"
          aria-label="Kaydırılabilir finans özeti"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              scrollSummary(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              scrollSummary(1);
            }
          }}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-scrollbar]:hidden"
        >
          {summaryCards.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              featured={card.featured}
              className="w-[250px] shrink-0 snap-start"
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">İşlem listesi</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredTransactions.length} kayıt görüntüleniyor.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Kategori, müşteri, proje veya açıklama ara"
                  className="sm:w-80"
                />
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                  className="sm:w-44"
                />
              </div>
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto rounded-sm border border-border">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    <span>İşlem</span>
                    <span>Tarih</span>
                    <span>Tutar</span>
                    <span>Durum</span>
                    <span className="text-right">İşlem</span>
                  </div>
                  <div className="divide-y divide-border">
                  {filteredTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      clients={clients}
                      projects={projects}
                    />
                  ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState hasQuery={Boolean(normalizedQuery)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Gider kategorileri</h2>
              <p className="text-sm text-muted-foreground">Aylık gider dağılımı</p>
            </div>
            {categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.category}</span>
                      <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bu ay gider kaydı yok.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TransactionRow({
  transaction,
  clients,
  projects,
}: {
  transaction: FinanceTransactionItem;
  clients: FinanceRelationOption[];
  projects: FinanceRelationOption[];
}) {
  const isIncome = transaction.type === "income";

  return (
    <div className="grid gap-4 px-4 py-4 grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1fr] items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className={isIncome ? "rounded-sm bg-emerald-50 p-2 text-emerald-700" : "rounded-sm bg-rose-50 p-2 text-rose-700"}>
          {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-foreground">
            {transaction.description || typeLabels[transaction.type]}
          </div>
          <div className="truncate text-sm text-muted-foreground">
            {transaction.category || "Kategori yok"} · {transaction.projectName || transaction.clientName || "Bağlantı yok"}
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{formatDate(transaction.transaction_date)}</div>
      <div className={isIncome ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
        {isIncome ? "+" : "-"}
        {formatCurrency(transaction.amount, transaction.currency)}
      </div>
      <div>
        <Badge className={paymentStatusClasses[transaction.payment_status]}>
          {paymentStatusLabels[transaction.payment_status]}
        </Badge>
      </div>
      <div className="flex justify-end gap-2">
        <FinanceDialog mode="edit" transaction={transaction} clients={clients} projects={projects} />
        <form action={deleteFinanceTransactionRecord}>
          <input type="hidden" name="id" value={transaction.id} />
          <Button effect="shine" type="submit" variant="secondary" className="gap-2 text-rose-600">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>
    </div>
  );
}

function FinanceDialog({
  mode,
  transaction,
  clients,
  projects,
}: {
  mode: "create" | "edit";
  transaction?: FinanceTransactionItem;
  clients: FinanceRelationOption[];
  projects: FinanceRelationOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = mode === "create" ? createFinanceTransactionRecord : updateFinanceTransactionRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      await action(formData);
      setOpen(false);
      toast.success(mode === "create" ? "İşlem eklendi." : "İşlem güncellendi.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Finans işlemi kaydedilirken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine" variant={mode === "create" ? "default" : "secondary"} className="gap-2">
          {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {mode === "create" ? "İşlem ekle" : "Düzenle"}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(680px,calc(100dvh-4rem))] sm:max-w-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>{mode === "create" ? "Yeni finans işlemi" : "Finans işlemini düzenle"}</DialogTitle>
            <DialogDescription>Gelir veya gider kaydını müşteri/proje bağlantısıyla kaydet.</DialogDescription>
          </DialogHeader>
          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <FinanceFormFields transaction={transaction} clients={clients} projects={projects} />
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
              {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {isSubmitting ? "Kaydediliyor" : mode === "create" ? "İşlemi ekle" : "Değişiklikleri kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FinanceFormFields({
  transaction,
  clients,
  projects,
}: {
  transaction?: FinanceTransactionItem;
  clients: FinanceRelationOption[];
  projects: FinanceRelationOption[];
}) {
  const [clientId, setClientId] = useState(transaction?.client_id || "__none");
  const [projectId, setProjectId] = useState(transaction?.project_id || "__none");
  const selectedProject =
    projectId === "__none" ? null : projects.find((project) => project.id === projectId) || null;
  const shouldLockClient = Boolean(selectedProject);
  const filteredProjects =
    clientId === "__none" || shouldLockClient
      ? projects
      : projects.filter((project) => project.client_id === clientId);
  const currencyValue = transaction?.currency || "USD";
  const hasCustomCurrency = !currencyOptions.some((currency) => currency.value === currencyValue);

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId);

    if (
      projectId !== "__none" &&
      nextClientId !== "__none" &&
      !projects.some((project) => project.id === projectId && project.client_id === nextClientId)
    ) {
      setProjectId("__none");
    }
  }

  function handleProjectChange(nextProjectId: string) {
    setProjectId(nextProjectId);

    if (nextProjectId === "__none") {
      return;
    }

    const nextProject = projects.find((project) => project.id === nextProjectId);
    setClientId(nextProject?.client_id || "__none");
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="type" label="Tip" defaultValue={transaction?.type || "income"}>
          <SelectItem value="income">Gelir</SelectItem>
          <SelectItem value="expense">Gider</SelectItem>
        </SelectField>
        <SelectField name="payment_status" label="Ödeme durumu" defaultValue={transaction?.payment_status || "planned"}>
          <SelectItem value="planned">Planlandı</SelectItem>
          <SelectItem value="pending">Bekliyor</SelectItem>
          <SelectItem value="paid">Ödendi</SelectItem>
          <SelectItem value="cancelled">İptal edildi</SelectItem>
        </SelectField>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Tutar</Label>
          <Input name="amount" type="number" min="0" step="0.01" required defaultValue={transaction?.amount ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label>Para birimi</Label>
          <Select name="currency" defaultValue={currencyValue}>
            <SelectTrigger>
              <SelectValue placeholder="Para birimi seç" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
              {hasCustomCurrency ? (
                <SelectItem value={currencyValue}>{currencyValue}</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Tarih</Label>
          <Input name="transaction_date" type="date" defaultValue={transaction?.transaction_date || new Date().toISOString().slice(0, 10)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Kategori</Label>
        <Input name="category" defaultValue={transaction?.category || ""} placeholder="Örn. Yazılım, müşteri ödemesi, vergi" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Müşteri</Label>
          {shouldLockClient ? <input type="hidden" name="client_id" value={clientId} /> : null}
          <Select
            name="client_id"
            value={clientId}
            onValueChange={handleClientChange}
            disabled={shouldLockClient}
          >
            <SelectTrigger>
              <SelectValue placeholder="Müşteri seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Müşteri yok</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Proje</Label>
          <Select name="project_id" value={projectId} onValueChange={handleProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Proje seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Proje yok</SelectItem>
              {filteredProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Açıklama</Label>
        <Textarea name="description" defaultValue={transaction?.description || ""} rows={3} />
      </div>
    </div>
  );
}

function SelectField({ name, label, defaultValue, children }: { name: string; label: string; defaultValue: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger><SelectValue placeholder={`${label} seç`} /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-8 text-center">
      <Wallet className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {hasQuery ? "Aramana uygun işlem yok" : "Henüz finans işlemi eklenmedi"}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasQuery
          ? "Arama metnini sadeleştirerek tekrar deneyebilirsin."
          : "İlk gelir veya gider kaydını ekleyerek aylık finans özetini oluşturmaya başlayabilirsin."}
      </p>
    </div>
  );
}

function calculateSummary(transactions: FinanceTransactionItem[]) {
  return transactions.reduce(
    (summary, transaction) => {
      if (transaction.type === "income" && transaction.payment_status === "paid") {
        summary.income += transaction.amount;
      }
      if (transaction.type === "expense" && transaction.payment_status === "paid") {
        summary.expense += transaction.amount;
      }
      if (transaction.payment_status === "pending" || transaction.payment_status === "planned") {
        summary.pending += transaction.amount;
      }
      summary.net = summary.income - summary.expense;
      summary.tax = summary.income * 0.20; // 20% KDV/Vergi tahmini
      summary.afterTax = summary.net - summary.tax;
      return summary;
    },
    { income: 0, expense: 0, net: 0, tax: 0, afterTax: 0, pending: 0 },
  );
}

function formatMessageContent(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={j}>{part.slice(1, -1)}</em>;
        }
        return <span key={j}>{part}</span>;
      })}
      {i !== lines.length - 1 && <br />}
    </span>
  ));
}

function AIFinanceDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/finance-analysis", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bilinmeyen bir hata oluştu.");
      }
      setResult(data.text);
    } catch (err: any) {
      setResult("Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine" variant="secondary" className="gap-2">
          <Brain className="h-4 w-4" />
          AI Analizi
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            Yapay Zeka Finansal Yorumlama
          </DialogTitle>
          <DialogDescription>
            Son 30 günlük finansal kayıtlarınızı analiz edip size önerilerde bulunuyorum.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!result && !loading && (
            <div className="text-center py-10">
              <Button variant="default" effect="shine" onClick={handleAnalyze} className="gap-2">
                <Brain className="h-4 w-4" />
                Raporu Oluştur
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-indigo-600">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Verileriniz analiz ediliyor...</p>
            </div>
          )}

          {result && (
            <div className="bg-muted/50 border border-border rounded-lg p-5 text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {formatMessageContent(result)}
            </div>
          )}
        </div>

        {result && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button effect="shine" variant="secondary" onClick={() => setOpen(false)}>Kapat</Button>
            <Button effect="shine" variant="default" onClick={handleAnalyze} className="gap-2">
              <Brain className="h-4 w-4" />
              Yeniden Oluştur
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function calculateExpenseCategories(transactions: FinanceTransactionItem[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const category = transaction.category || "Kategori yok";
    totals.set(category, (totals.get(category) || 0) + transaction.amount);
  }

  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
