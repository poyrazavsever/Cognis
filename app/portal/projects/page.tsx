import { Card, CardContent, Badge } from "poyraz-ui/atoms";
import { FolderKanban, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { requirePortalBackend } from "@/server/web/portal";

export default async function PortalProjectsPage() {
  const { actor, service } = await requirePortalBackend();
  const projects = service.listProjects(actor);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projeleriniz</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full py-10 text-center border rounded-lg border-dashed text-muted-foreground flex flex-col items-center gap-3">
            <FolderKanban className="w-10 h-10 text-muted-foreground/50" />
            Henüz size atanmış bir proje bulunmuyor.
          </div>
        ) : projects.map((project) => (
          <Link key={project.id} href={`/portal/projects/${project.id}`}>
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg line-clamp-2">{project.name}</h3>
                    <Badge variant={project.status === "completed" ? "secondary" : "default"} className="capitalize shrink-0">
                      {project.status}
                    </Badge>
                  </div>
                  {project.dueDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Son Teslim: {format(new Date(project.dueDate), "d MMM yyyy", { locale: tr })}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>İlerleme</span>
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
  );
}
