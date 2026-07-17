"use client";

import {
  createDailyLogRecord,
  deleteDailyLogRecord,
  updateDailyLogRecord,
} from "@/app/(dashboard)/journal/actions";
import { Badge, Button, Card, CardContent, Input, Label, Textarea } from "poyraz-ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  toast,
} from "poyraz-ui/molecules";
import {
  Activity,
  Battery,
  CalendarDays,
  LineChart as LineChartIcon,
  Pencil,
  Plus,
  Smile,
  Trash2,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { StatCard } from "@/components/system/stat-card";

export type DailyLogItem = {
  id: string;
  log_date: string;
  mood_score: number;
  energy_score: number;
  work_satisfaction_score: number | null;
  note: string | null;
};

type JournalClientProps = {
  logs: DailyLogItem[];
};

const scoreLabels: Record<number, string> = {
  1: "Çok düşük",
  2: "Düşük",
  3: "Orta",
  4: "İyi",
  5: "Çok iyi",
};

export function JournalClient({ logs }: JournalClientProps) {
  const summary = useMemo(() => calculateSummary(logs), [logs]);
  const chartData = useMemo(
    () =>
      [...logs]
        .sort((a, b) => a.log_date.localeCompare(b.log_date))
        .map((log) => ({
          date: formatShortDate(log.log_date),
          mood: log.mood_score,
          energy: log.energy_score,
          satisfaction: log.work_satisfaction_score,
        })),
    [logs],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            Mood ve enerji
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Günlük ruh hali, enerji ve çalışma memnuniyetini takip ederek kişisel kapasite trendini gör.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <DailyLogDialog mode="create" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="Ortalama mood"
          value={summary.moodAverage ? summary.moodAverage.toFixed(1) : "-"}
          icon={Smile}
          tone="primary"
        />
        <StatCard
          label="Ortalama enerji"
          value={summary.energyAverage ? summary.energyAverage.toFixed(1) : "-"}
          icon={Battery}
          tone="green"
        />
        <StatCard
          label="Memnuniyet"
          value={summary.satisfactionAverage ? summary.satisfactionAverage.toFixed(1) : "-"}
          icon={LineChartIcon}
          tone="blue"
        />
        <StatCard
          label="Kayıtlı gün"
          value={String(logs.length)}
          icon={CalendarDays}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Genel trend</h2>
              <p className="text-sm text-muted-foreground">
                Mood, enerji ve çalışma memnuniyetinin günlük değişimi.
              </p>
            </div>

            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ left: -16, right: 16, top: 12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--poyraz-border)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis domain={[1, 5]} tickCount={5} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        border: "1px solid var(--poyraz-border)",
                        borderRadius: 4,
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Line type="monotone" dataKey="mood" name="Mood" stroke="#dc2626" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="energy" name="Enerji" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} />
                    <Line
                      type="monotone"
                      dataKey="satisfaction"
                      name="Memnuniyet"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Kapasite sinyali</h2>
              <p className="text-sm text-muted-foreground">Kayıtlardan kısa okuma.</p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              {summary.insights.map((insight) => (
                <div key={insight} className="rounded-sm border border-border bg-muted/20 p-3">
                  {insight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Günlük kayıtlar</h2>
              <p className="text-sm text-muted-foreground">{logs.length} kayıt görüntüleniyor.</p>
            </div>
          </div>

          {logs.length > 0 ? (
            <div className="overflow-x-auto rounded-sm border border-border">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[0.7fr_0.7fr_0.7fr_1.8fr_0.8fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  <span>Tarih</span>
                  <span>Mood</span>
                  <span>Enerji</span>
                  <span>Not</span>
                  <span className="text-right">İşlem</span>
                </div>
                <div className="divide-y divide-border">
                {logs.map((log) => (
                  <DailyLogRow key={log.id} log={log} />
                ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DailyLogRow({ log }: { log: DailyLogItem }) {
  return (
    <div className="grid gap-4 px-4 py-4 grid-cols-[0.7fr_0.7fr_0.7fr_1.8fr_0.8fr] items-center">
      <div>
        <div className="font-medium text-foreground">{formatDate(log.log_date)}</div>
        <div className="text-xs text-muted-foreground">{formatWeekday(log.log_date)}</div>
      </div>
      <ScoreBadge score={log.mood_score} tone="primary" />
      <ScoreBadge score={log.energy_score} tone="green" />
      <div className="min-w-0 text-sm text-muted-foreground">
        <p className="line-clamp-2">{log.note || "Not eklenmedi."}</p>
        {log.work_satisfaction_score ? (
          <p className="mt-1 text-xs">Çalışma memnuniyeti: {log.work_satisfaction_score}/5</p>
        ) : null}
      </div>
      <div className="flex justify-start gap-2 lg:justify-end">
        <DailyLogDialog mode="edit" log={log} />
        <form action={deleteDailyLogRecord}>
          <input type="hidden" name="id" value={log.id} />
          <Button type="submit" variant="outline" className="h-9 gap-2 text-rose-600">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>
    </div>
  );
}

function DailyLogDialog({ mode, log }: { mode: "create" | "edit"; log?: DailyLogItem }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = mode === "create" ? createDailyLogRecord : updateDailyLogRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      await action(formData);
      setOpen(false);
      toast.success(mode === "create" ? "Günlük eklendi." : "Günlük güncellendi.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Günlük kaydedilirken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "create" ? "default" : "outline"} className="h-9 gap-2">
          {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {mode === "create" ? "Günlük ekle" : "Düzenle"}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(680px,calc(100dvh-4rem))] sm:max-w-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {log ? <input type="hidden" name="id" value={log.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>{mode === "create" ? "Yeni günlük kayıt" : "Günlük kaydı düzenle"}</DialogTitle>
            <DialogDescription>
              Günün mood, enerji ve çalışma memnuniyeti skorlarını kaydet.
            </DialogDescription>
          </DialogHeader>

          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <DailyLogFormFields log={log} />
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
              {isSubmitting ? "Kaydediliyor" : mode === "create" ? "Kaydı ekle" : "Değişiklikleri kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DailyLogFormFields({ log }: { log?: DailyLogItem }) {
  const [moodScore, setMoodScore] = useState(log?.mood_score || 3);
  const [energyScore, setEnergyScore] = useState(log?.energy_score || 3);
  const [satisfactionScore, setSatisfactionScore] = useState(log?.work_satisfaction_score || 3);

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label>Tarih</Label>
        <Input
          name="log_date"
          type="date"
          defaultValue={log?.log_date || new Date().toISOString().slice(0, 10)}
        />
      </div>

      <ScorePicker
        name="mood_score"
        label="Mood skoru"
        value={moodScore}
        onChange={setMoodScore}
        tone="primary"
      />
      <ScorePicker
        name="energy_score"
        label="Enerji skoru"
        value={energyScore}
        onChange={setEnergyScore}
        tone="green"
      />
      <ScorePicker
        name="work_satisfaction_score"
        label="Çalışma memnuniyeti"
        value={satisfactionScore}
        onChange={setSatisfactionScore}
        tone="blue"
      />

      <div className="grid gap-2">
        <Label>Not</Label>
        <Textarea
          name="note"
          defaultValue={log?.note || ""}
          rows={4}
          placeholder="Bugün nasıl geçti, enerjini etkileyen şeyler nelerdi?"
        />
      </div>
    </div>
  );
}

function ScorePicker({
  name,
  label,
  value,
  onChange,
  tone,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  tone: "primary" | "green" | "blue";
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">{scoreLabels[value]}</span>
      </div>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`h-10 rounded-sm border text-sm font-semibold transition-colors ${
              value === score
                ? getScoreActiveClass(tone)
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreBadge({ score, tone }: { score: number; tone: "primary" | "green" }) {
  const className =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-primary/20 bg-primary/10 text-primary";

  return <Badge className={className}>{score}/5 · {scoreLabels[score]}</Badge>;
}

function EmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-8 text-center">
      <Activity className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">Henüz günlük kayıt yok</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Mood ve enerji trendini görmek için ilk günlük kaydını ekle.
      </p>
    </div>
  );
}

function calculateSummary(logs: DailyLogItem[]) {
  const moodAverage = average(logs.map((log) => log.mood_score));
  const energyAverage = average(logs.map((log) => log.energy_score));
  const satisfactionAverage = average(
    logs
      .map((log) => log.work_satisfaction_score)
      .filter((score): score is number => typeof score === "number"),
  );

  const insights = [];

  if (logs.length === 0) {
    insights.push("Henüz okunabilir bir trend yok.");
  } else {
    insights.push(`Toplam ${logs.length} günlük kayıt var.`);
    insights.push(
      energyAverage && energyAverage < 3
        ? "Enerji ortalaması düşük. Dashboard raporlarında geciken işler ile birlikte okunmalı."
        : "Enerji ortalaması dengeli görünüyor.",
    );
    insights.push(
      moodAverage && moodAverage >= 4
        ? "Mood seviyesi güçlü. Yüksek odak isteyen işler için iyi bir dönem olabilir."
        : "Mood trendi izlenmeli. Not alanı hangi günlerin zor geçtiğini anlamak için önemli.",
    );
  }

  return { moodAverage, energyAverage, satisfactionAverage, insights };
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getScoreActiveClass(tone: "primary" | "green" | "blue") {
  if (tone === "green") return "border-emerald-600 bg-emerald-600 text-white";
  if (tone === "blue") return "border-blue-600 bg-blue-600 text-white";
  return "border-primary bg-primary text-primary-foreground";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
  }).format(new Date(`${value}T00:00:00`));
}
