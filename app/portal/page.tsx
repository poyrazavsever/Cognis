import { Card, CardContent, Badge } from "poyraz-ui/atoms";
import { FolderKanban, CheckCircle2, Clock, Activity, BarChart, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { requirePortalBackend } from "@/server/web/portal";

export default async function PortalDashboardPage() {
  const { context, actor, service } = await requirePortalBackend();
  const client = service.getClient(actor, context.profile.clientId!);
  const projects = service.listProjects(actor);
  const activeProjects = projects.filter((project) => project.status !== "completed" && project.status !== "cancelled");
  const completedProjects = projects.filter((project) => project.status === "completed");
  const avgProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            Genel Bakış
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground">Müşteri Paneli</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Hoş geldiniz, {client.name}. Aktif projelerinizi ve ilerlemeleri buradan takip edin.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Aktif Projeler" value={String(activeProjects.length)} icon={FolderKanban} tone="blue" />
        <StatCard label="Tamamlanan" value={String(completedProjects.length)} icon={CheckCircle2} tone="green" />
        <StatCard label="Ortalama İlerleme" value={`%${avgProgress}`} icon={BarChart} tone="amber" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tüm Projeleriniz</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 ? (
            <div className="col-span-full py-10 text-center border rounded-lg border-dashed text-muted-foreground">
              Henüz size atanmış bir proje bulunmuyor.
            </div>
          ) : projects.map((project) => (
            <Link key={project.id} href={`/portal/projects/${project.id}`}>
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 shrink-0 rounded-full ${project.status === "completed" ? "bg-emerald-500" : project.status === "active" ? "bg-blue-500" : "bg-amber-500"}`} />
                        <h3 className="font-semibold text-base line-clamp-2 leading-tight">{project.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={project.status === "completed" ? "secondary" : "default"} className="capitalize text-[10px] px-1.5 py-0">
                        {project.status === "completed" ? "Tamamlandı" : project.status === "active" ? "Aktif" : "Beklemede"}
                      </Badge>
                      {project.dueDate && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Teslim: {format(new Date(project.dueDate), "d MMM yyyy", { locale: tr })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground">İlerleme</span>
                      <span>%{project.progress}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "amber";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
