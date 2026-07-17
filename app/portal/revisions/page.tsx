import { Card, CardContent, Badge } from "poyraz-ui/atoms";
import { Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { requirePortalBackend } from "@/server/web/portal";

export default async function PortalRevisionsPage() {
  const { actor, service } = await requirePortalBackend();
  const projects = service.listProjects(actor);
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const revisions = service.listPortalRevisions(actor)
    .filter((revision) => projectNames.has(revision.projectId));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Revizyon Taleplerim</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {revisions.length === 0 ? (
          <div className="col-span-full py-10 text-center border rounded-lg border-dashed text-muted-foreground flex flex-col items-center gap-3">
            <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
            Henüz bir revizyon talebinde bulunmadınız.
          </div>
        ) : revisions.map((revision) => (
          <Card key={revision.id} className="h-full">
            <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(revision.createdAt, "d MMM yyyy, HH:mm", { locale: tr })}
                  </div>
                  <Badge
                    variant={revision.status === "completed" ? "default" : revision.status === "rejected" ? "destructive" : "secondary"}
                    className="capitalize shrink-0"
                  >
                    {revision.status === "pending" ? "Bekliyor" : revision.status === "in_progress" ? "İşleniyor" : revision.status === "completed" ? "Tamamlandı" : "Reddedildi"}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Proje:</span>
                  <span className="text-sm font-semibold truncate bg-muted/30 p-2 rounded-md">
                    {projectNames.get(revision.projectId)}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{revision.description}</p>
              </div>
              <div className="flex items-center justify-end border-t border-border pt-4">
                <Link href={`/portal/projects/${revision.projectId}`} className="text-xs text-primary font-medium hover:underline">
                  Projeye Git &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
