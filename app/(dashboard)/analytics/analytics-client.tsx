"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { Card, CardContent } from "poyraz-ui/atoms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "poyraz-ui/molecules";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, Legend
} from "recharts";

export type AnalyticsData = {
  metrics: {
    projectIncomeData: { name: string; value: number }[];
    completedTasks: number;
    activeTasks: number;
  };
  range: string;
};

type AnalyticsClientProps = {
  data: AnalyticsData;
};

const COLORS = ["var(--poyraz-primary)", "var(--poyraz-destructive)", "#eab308", "#3b82f6", "#8b5cf6"];

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const handleRangeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`${pathname}?${params.toString()}`);
  };

  const { projectIncomeData, completedTasks, activeTasks } = data.metrics;
  
  const taskStatusData = [
    { name: t("analytics.tasks.completed"), value: completedTasks },
    { name: t("analytics.tasks.ongoing"), value: activeTasks }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(getDocumentIntlLocale(), {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            {t("analytics.title")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Select value={data.range} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("analytics.range.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">{t("analytics.range.thisWeek")}</SelectItem>
              <SelectItem value="this_month">{t("analytics.range.thisMonth")}</SelectItem>
              <SelectItem value="this_year">{t("analytics.range.thisYear")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-6 text-sm font-semibold text-foreground">{t("analytics.sections.incomeDistribution")}</h3>
            <div className="h-[300px] w-full">
              {projectIncomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectIncomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectIncomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                      contentStyle={{ 
                        backgroundColor: 'var(--poyraz-background)',
                        borderColor: 'var(--poyraz-border)',
                        borderRadius: '0.375rem',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("analytics.empty")}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-6 text-sm font-semibold text-foreground">{t("analytics.sections.taskStatus")}</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--poyraz-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--poyraz-muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--poyraz-muted-foreground)' }} dx={-10} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-xl p-3 shadow-lg shadow-black/5">
                            <p className="font-medium text-foreground mb-2 text-sm">{label}</p>
                            <div className="space-y-1.5">
                              {payload.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between gap-6 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-muted-foreground">{t("analytics.tasks.count")}</span>
                                  </div>
                                  <span className="font-semibold text-foreground">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    barSize={60} 
                    activeBar={{ fill: "#2563eb" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
