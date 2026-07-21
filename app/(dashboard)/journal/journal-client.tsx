"use client";

import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { LocalizedFields, type LocalizedFieldLocale, type LocalizedFieldValues } from "@/components/i18n/localized-fields";
import { contentTranslationRegistry } from "@/lib/i18n/content";
import {
  createDailyLogRecord,
  deleteDailyLogRecord,
  updateDailyLogRecord,
} from "@/app/(dashboard)/journal/actions";
import { Badge, Button, Card, CardContent, Input, Label } from "poyraz-ui/atoms";
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
  mood_label: string | null;
  note: string | null;
  translations?: LocalizedFieldValues;
};

type JournalClientProps = {
  logs: DailyLogItem[];
  localization: {
    defaultLocale: string;
    locales: LocalizedFieldLocale[];
  };
};

const scoreLabels = (t: ReturnType<typeof useTranslations>) => ({
  1: t("journal.scores.veryLow"),
  2: t("journal.scores.low"),
  3: t("journal.scores.medium"),
  4: t("journal.scores.high"),
  5: t("journal.scores.veryHigh"),
});

export function JournalClient({ logs, localization }: JournalClientProps) {
  const t = useTranslations();
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
            {t("journal.title")}
          </h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <DailyLogDialog mode="create" localization={localization} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard
          label={t("journal.stats.averageMood")}
          value={summary.moodAverage ? summary.moodAverage.toFixed(1) : "-"}
          icon={Smile}
          tone="primary"
        />
        <StatCard
          label={t("journal.stats.averageEnergy")}
          value={summary.energyAverage ? summary.energyAverage.toFixed(1) : "-"}
          icon={Battery}
          tone="green"
        />
        <StatCard
          label={t("journal.stats.satisfaction")}
          value={summary.satisfactionAverage ? summary.satisfactionAverage.toFixed(1) : "-"}
          icon={LineChartIcon}
          tone="blue"
        />
        <StatCard
          label={t("journal.stats.recordedDays")}
          value={String(logs.length)}
          icon={CalendarDays}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">{t("journal.charts.trend.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("journal.charts.trend.description")}
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
                    <Line type="monotone" dataKey="mood" name={t("journal.fields.mood")} stroke="#dc2626" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="energy" name={t("journal.fields.energy")} stroke="#059669" strokeWidth={3} dot={{ r: 3 }} />
                    <Line
                      type="monotone"
                      dataKey="satisfaction"
                      name={t("journal.fields.satisfaction")}
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
              <h2 className="text-base font-semibold text-foreground">{t("journal.charts.insights.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("journal.charts.insights.description")}</p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              {summary.length === 0 ? (
                <div className="rounded-sm border border-border bg-muted/20 p-3">
                  {t("journal.insights.noTrend")}
                </div>
              ) : (
                <>
                  <div className="rounded-sm border border-border bg-muted/20 p-3">
                    {t("journal.insights.totalDays", { count: summary.length })}
                  </div>
                  <div className="rounded-sm border border-border bg-muted/20 p-3">
                    {summary.energyAverage && summary.energyAverage < 3
                      ? t("journal.insights.lowEnergy")
                      : t("journal.insights.balancedEnergy")}
                  </div>
                  <div className="rounded-sm border border-border bg-muted/20 p-3">
                    {summary.moodAverage && summary.moodAverage >= 4
                      ? t("journal.insights.strongMood")
                      : t("journal.insights.watchMood")}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">{t("journal.list.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("journal.list.description", { count: logs.length })}</p>
            </div>
          </div>

          {logs.length > 0 ? (
            <div className="overflow-x-auto rounded-sm border border-border">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[0.7fr_0.7fr_0.7fr_1.8fr_0.8fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  <span>{t("journal.list.headers.date")}</span>
                  <span>{t("journal.list.headers.mood")}</span>
                  <span>{t("journal.list.headers.energy")}</span>
                  <span>{t("journal.list.headers.note")}</span>
                  <span className="text-right">{t("journal.list.headers.action")}</span>
                </div>
                <div className="divide-y divide-border">
                {logs.map((log) => (
                  <DailyLogRow key={log.id} log={log} localization={localization} />
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

function DailyLogRow({ log, localization }: { log: DailyLogItem; localization: JournalClientProps["localization"] }) {
  const t = useTranslations();
  return (
    <div className="grid gap-4 px-4 py-4 grid-cols-[0.7fr_0.7fr_0.7fr_1.8fr_0.8fr] items-center">
      <div>
        <div className="font-medium text-foreground">{formatDate(log.log_date)}</div>
        <div className="text-xs text-muted-foreground">{formatWeekday(log.log_date)}</div>
      </div>
      <div className="min-w-0">
        <ScoreBadge score={log.mood_score} tone="primary" />
        {log.mood_label ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">{log.mood_label}</p>
        ) : null}
      </div>
      <ScoreBadge score={log.energy_score} tone="green" />
      <div className="min-w-0 text-sm text-muted-foreground">
        <p className="line-clamp-2">{log.note || t("journal.empty.noNote")}</p>
        {log.work_satisfaction_score ? (
          <p className="mt-1 text-xs">{t("journal.fields.satisfaction")}: {log.work_satisfaction_score}/5</p>
        ) : null}
      </div>
      <div className="flex justify-start gap-2 lg:justify-end">
        <DailyLogDialog mode="edit" log={log} localization={localization} />
        <form action={deleteDailyLogRecord}>
          <input type="hidden" name="id" value={log.id} />
          <Button effect="shine" type="submit" variant="secondary" className="gap-2 text-rose-600">
            <Trash2 className="h-4 w-4" />
            {t("journal.actions.delete")}
          </Button>
        </form>
      </div>
    </div>
  );
}

function DailyLogDialog({ mode, log, localization }: { mode: "create" | "edit"; log?: DailyLogItem; localization: JournalClientProps["localization"] }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = mode === "create" ? createDailyLogRecord : updateDailyLogRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      await action(formData);
      setOpen(false);
      toast.success(mode === "create" ? t("journal.form.messages.createSuccess") : t("journal.form.messages.updateSuccess"));
    } catch (error) {
      toast.error(resolveTranslatedError(t, error, "journal.form.messages.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine" variant={mode === "create" ? "default" : "secondary"} className="gap-2">
          {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {mode === "create" ? t("journal.actions.add") : t("journal.actions.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(680px,calc(100dvh-4rem))] sm:max-w-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {log ? <input type="hidden" name="id" value={log.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>{mode === "create" ? t("journal.form.createTitle") : t("journal.form.editTitle")}</DialogTitle>
            <DialogDescription>
              {t("journal.form.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <DailyLogFormFields log={log} localization={localization} />
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
              {isSubmitting ? t("journal.actions.saving") : mode === "create" ? t("journal.form.submitCreate") : t("journal.form.submitEdit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DailyLogFormFields({ log, localization }: { log?: DailyLogItem; localization: JournalClientProps["localization"] }) {
  const t = useTranslations();
  const [moodScore, setMoodScore] = useState(log?.mood_score || 3);
  const [energyScore, setEnergyScore] = useState(log?.energy_score || 3);
  const [satisfactionScore, setSatisfactionScore] = useState(log?.work_satisfaction_score || 3);

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label>{t("journal.fields.date")}</Label>
        <Input
          name="log_date"
          type="date"
          defaultValue={log?.log_date || new Date().toISOString().slice(0, 10)}
        />
      </div>

      <ScorePicker
        name="mood_score"
        label={t("journal.fields.mood")}
        value={moodScore}
        onChange={setMoodScore}
      />
      <ScorePicker
        name="energy_score"
        label={t("journal.fields.energy")}
        value={energyScore}
        onChange={setEnergyScore}
      />
      <ScorePicker
        name="work_satisfaction_score"
        label={t("journal.fields.satisfaction")}
        value={satisfactionScore}
        onChange={setSatisfactionScore}
      />

      <LocalizedFields
        idPrefix={`journal-${log?.id || "new"}-content`}
        defaultLocale={localization.defaultLocale}
        locales={localization.locales}
        fields={contentTranslationRegistry.journal_entry
          .map((f) => ({
            ...f,
            label: t(`journal.fields.${f.name}`) || f.label,
            placeholder: "placeholder" in f && typeof f.placeholder === "string"
              ? t(`journal.placeholders.${f.name}`) || f.placeholder
              : undefined,
          }))}
        values={log?.translations}
        fallbackValues={{
          moodLabel: log?.mood_label,
          note: log?.note,
        }}
      />
    </div>
  );
}

function ScorePicker({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations();
  const labels = scoreLabels(t);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">{labels[value as keyof typeof labels]}</span>
      </div>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <Button
            effect="shine"
            key={score}
            type="button"
            variant={value === score ? "default" : "secondary"}
            onClick={() => onChange(score)}
          >
            {score}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ScoreBadge({ score, tone }: { score: number; tone: "primary" | "green" }) {
  const t = useTranslations();
  const labels = scoreLabels(t);
  const className =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-primary/20 bg-primary/10 text-primary";

  return <Badge className={className}>{score}/5 · {labels[score as keyof typeof labels]}</Badge>;
}

function resolveTranslatedError(
  t: ReturnType<typeof useTranslations>,
  error: unknown,
  fallbackKey: string,
) {
  if (!(error instanceof Error)) return t(fallbackKey);
  if (/^(journal|api|validation)\./.test(error.message)) return t(error.message);
  return error.message || t(fallbackKey);
}

function EmptyState() {
  const t = useTranslations();
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-8 text-center">
      <Activity className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{t("journal.empty.noRecordTitle")}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("journal.empty.noRecordDesc")}
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

  return { moodAverage, energyAverage, satisfactionAverage, length: logs.length };
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat(getDocumentIntlLocale(), {
    weekday: "long",
  }).format(new Date(`${value}T00:00:00`));
}
