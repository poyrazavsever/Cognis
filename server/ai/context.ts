import type { DomainActor } from "../domain/actor";
import { DomainError } from "../domain/errors";
import type { DomainService } from "../services/domain";

const MAX_CONTEXT_CHARS = 16_000;

export function buildChatContext(
  service: DomainService,
  actor: DomainActor,
  now = new Date(),
): string {
  const since = daysAgo(now, 30);
  const tasks = service.listTasks(actor).slice(0, 20);
  const projects = service.listProjects(actor).slice(0, 12);
  const clients = new Map(service.listClients(actor).map((client) => [client.id, client.name]));
  const finance = service
    .listFinanceTransactions(actor)
    .filter((item) => item.transactionDate >= since)
    .slice(0, 20);
  const journal = service
    .listJournalEntries(actor)
    .filter((item) => item.entryDate >= since)
    .slice(0, 14);

  return capContext([
    section("Görevler", tasks.map((task) => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt?.toISOString() ?? null,
    }))),
    section("Projeler", projects.map((project) => ({
      name: project.name,
      client: project.clientId ? clients.get(project.clientId) ?? null : null,
      status: project.status,
      progress: project.progress,
      dueDate: project.dueDate,
    }))),
    section("Son 30 gün finans", finance.map((item) => ({
      type: item.type,
      amount: minorToMajor(item.amountMinor),
      currency: item.currency,
      category: item.category,
      paymentStatus: item.paymentStatus,
      date: item.transactionDate,
    }))),
    section("Son günlük kayıtlar", journal.map((entry) => ({
      date: entry.entryDate,
      mood: entry.moodScore,
      energy: entry.energyScore,
      workSatisfaction: entry.workSatisfactionScore,
      note: entry.note,
    }))),
  ].join("\n\n"));
}

export function buildFinanceAnalysisContext(
  service: DomainService,
  actor: DomainActor,
  now = new Date(),
): { hasData: boolean; text: string } {
  const since = daysAgo(now, 30);
  const transactions = service
    .listFinanceTransactions(actor)
    .filter((item) => item.transactionDate >= since)
    .slice(0, 200);
  const totals = new Map<string, { incomeMinor: number; expenseMinor: number }>();
  for (const transaction of transactions) {
    const current = totals.get(transaction.currency) ?? { incomeMinor: 0, expenseMinor: 0 };
    if (transaction.type === "income") current.incomeMinor += transaction.amountMinor;
    else current.expenseMinor += transaction.amountMinor;
    totals.set(transaction.currency, current);
  }

  return {
    hasData: transactions.length > 0,
    text: capContext([
      "Kullanıcının son 30 günlük finansal durumu:",
      ...Array.from(totals, ([currency, value]) =>
        `- ${currency}: gelir ${minorToMajor(value.incomeMinor)}, gider ${minorToMajor(value.expenseMinor)}, net ${minorToMajor(value.incomeMinor - value.expenseMinor)}`,
      ),
      `- İşlem sayısı: ${transactions.length}`,
      "İşlemler:",
      ...transactions.map((item) =>
        `- ${item.transactionDate} | ${item.type === "income" ? "Gelir" : "Gider"} | ${clean(item.category) || "Kategorisiz"} | ${minorToMajor(item.amountMinor)} ${item.currency}`,
      ),
    ].join("\n")),
  };
}

export function buildProjectRiskContext(
  service: DomainService,
  actor: DomainActor,
  projectId?: string,
): string {
  const projects = service.listProjects(actor);
  const clients = new Map(service.listClients(actor).map((client) => [client.id, client.name]));

  if (projectId) {
    const project = service.getProject(actor, projectId);
    const tasks = service.listTasks(actor, project.id);
    const completed = tasks.filter((task) => task.status === "done").length;

    return capContext([
      `Proje adı: ${clean(project.name)}`,
      `Müşteri: ${project.clientId ? clean(clients.get(project.clientId) ?? "Bilinmiyor") : "Yok"}`,
      `Durum: ${project.status}`,
      `Bütçe: ${project.budgetAmountMinor == null ? "Bilinmiyor" : minorToMajor(project.budgetAmountMinor)} ${project.currency}`,
      `İlerleme: %${project.progress}`,
      `Başlangıç: ${project.startDate ?? "Bilinmiyor"}`,
      `Bitiş: ${project.dueDate ?? "Bilinmiyor"}`,
      `Görevler: ${tasks.length} adet (${completed} tamamlandı)`,
    ].join("\n"));
  }

  const activeProjects = projects.filter((project) => project.status === "active").slice(0, 50);
  if (activeProjects.length === 0) {
    throw new DomainError("NOT_FOUND", "Aktif proje bulunamadı.");
  }

  return capContext([
    "Aktif projeler:",
    ...activeProjects.map((project) =>
      `- ${clean(project.name)} | İlerleme: %${project.progress} | Bitiş: ${project.dueDate ?? "Yok"}`,
    ),
  ].join("\n"));
}

function section(title: string, rows: unknown[]): string {
  if (rows.length === 0) return `${title}: kayıt yok.`;
  return `${title}:\n${rows.map((row) => `- ${JSON.stringify(row)}`).join("\n")}`;
}

function daysAgo(now: Date, days: number): string {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function minorToMajor(value: number): string {
  return (value / 100).toFixed(2);
}

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function capContext(value: string): string {
  return value.length <= MAX_CONTEXT_CHARS
    ? value
    : `${value.slice(0, MAX_CONTEXT_CHARS)}\n[Bağlam boyut sınırı nedeniyle kısaltıldı.]`;
}
