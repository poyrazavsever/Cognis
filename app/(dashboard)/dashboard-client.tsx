"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PendingLink } from "@/components/ui/pending-link";
import { Badge, Card, CardContent } from "poyraz-ui/atoms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "poyraz-ui/molecules";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { CheckCircle2, Wallet, FolderKanban, Activity, Users } from "lucide-react";

export type DashboardData = {
  metrics: {
    netProfit: number;
    activeProjectsCount: number;
    completedTasksCount: number;
    avgMood: string;
    financeTrend: { date: string; income: number; expense: number }[];
    moodTrend: { date: string; mood: number; energy: number }[];
  };
  projects: { id: string; status: string; name: string; created_at: string }[];
  clients: { id: string; name: string; company_name: string; created_at: string }[];
  range: string;
};

type DashboardClientProps = {
  data: DashboardData;
};

export function DashboardClient({ data }: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const handleRangeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`${pathname}?${params.toString()}`);
  };

  const { netProfit, activeProjectsCount, completedTasksCount, avgMood, financeTrend, moodTrend } = data.metrics;

  // Format dates for Recharts using local timezone
  const incomeTrendData = (financeTrend || []).map(f => ({
    name: new Date(f.date).toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
    income: f.income,
    expense: f.expense
  }));

  const moodTrendData = (moodTrend || []).map(l => ({
    date: new Date(l.date).toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
    mood: l.mood,
    energy: l.energy,
  }));

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            Genel Bakış
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground">
              Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              İş performansını, gelirlerini ve günlük durumunu takip et.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={data.range} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tarih aralığı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="this_week">Bu Hafta</SelectItem>
              <SelectItem value="this_month">Bu Ay</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Net Kazanç" value={formatCurrency(netProfit)} icon={Wallet} tone="green" />
        <StatCard label="Aktif Projeler" value={activeProjectsCount.toString()} icon={FolderKanban} tone="blue" />
        <StatCard label="Tamamlanan Görev" value={completedTasksCount.toString()} icon={CheckCircle2} tone="amber" />
        <StatCard label="Ortalama Mood" value={avgMood} icon={Activity} tone="red" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-6 text-sm font-semibold text-foreground">Gelir / Gider Özeti</h3>
            <div className="h-[300px] w-full">
              {incomeTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--poyraz-border)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'var(--poyraz-muted-foreground)' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'var(--poyraz-muted-foreground)' }}
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-xl p-3 shadow-lg shadow-black/5">
                              <p className="font-medium text-foreground mb-2 text-sm">{label}</p>
                              <div className="space-y-1.5">
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-6 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="text-muted-foreground">{entry.name === 'income' ? 'Gelir' : 'Gider'}</span>
                                    </div>
                                    <span className="font-semibold text-foreground">
                                      {formatCurrency(entry.value)}
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
                      dataKey="income" 
                      name="income"
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]} 
                      activeBar={{ fill: "#059669" }}
                    />
                    <Bar 
                      dataKey="expense" 
                      name="expense"
                      fill="#f43f5e" 
                      radius={[4, 4, 0, 0]} 
                      activeBar={{ fill: "#e11d48" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Bu tarih aralığında finansal veri yok.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-6 text-sm font-semibold text-foreground">Mood & Enerji Trendi</h3>
            <div className="h-[300px] w-full">
              {moodTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--poyraz-border)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'var(--poyraz-muted-foreground)' }}
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 5]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'var(--poyraz-muted-foreground)' }}
                      width={30}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--poyraz-background)',
                        borderColor: 'var(--poyraz-border)',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="var(--poyraz-primary)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--poyraz-primary)", strokeWidth: 2, stroke: "var(--poyraz-background)" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="#eab308" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#eab308", strokeWidth: 2, stroke: "var(--poyraz-background)" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Bu tarih aralığında günlük verisi yok.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Son Eklenen Projeler</h3>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {(data.projects || []).slice(0, 5).map((project) => (
                <PendingLink key={project.id} href={`/projects/${project.id}`} className="flex items-center gap-3 hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors" showSpinner>
                  <div className={`h-2 w-2 rounded-full ${project.status === 'completed' ? 'bg-emerald-500' : project.status === 'active' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <Badge variant={project.status === 'completed' ? 'secondary' : 'default'} className="capitalize text-[10px] px-1.5 py-0">
                      {project.status === 'completed' ? 'Tamamlandı' : project.status === 'active' ? 'Aktif' : 'Beklemede'}
                    </Badge>
                  </div>
                </PendingLink>
              ))}
              {data.projects.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-sm border-border bg-muted/20">Henüz proje yok.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Son Eklenen Müşteriler</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {(data.clients || []).length > 0 ? (data.clients || []).map((client) => (
                <PendingLink key={client.id} href={`/clients/${client.id}`} className="flex items-center gap-3 hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors" showSpinner>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.company_name || "Bireysel"}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(client.created_at).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}
                  </div>
                </PendingLink>
              )) : (
                <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-sm border-border bg-muted/20">Henüz müşteri yok.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof FolderKanban;
  tone: "green" | "blue" | "amber" | "red";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-primary/10 text-primary",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-sm ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
