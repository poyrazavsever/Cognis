"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, Badge, Button, Textarea, Label } from "poyraz-ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "poyraz-ui/molecules";
import { CheckCircle2, Clock, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { toast } from "poyraz-ui/molecules";
import { createRevisionRequest } from "./actions";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "poyraz-ui/molecules";

export type PortalProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "paused" | "completed" | "cancelled";
  progress: number;
  due_date: string | null;
  revision_quota: number;
  can_request_revision: boolean;
};

export type PortalPlanningSection = {
  id: string;
  title: string;
  content: string | null;
  type: string;
};

export type PortalTask = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  date: string | null;
};

export type PortalRevision = {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  created_at: string;
};

type PortalProjectClientProps = {
  project: PortalProjectDetail;
  sections: PortalPlanningSection[];
  tasks: PortalTask[];
  revisions: PortalRevision[];
};

export function PortalProjectClient({ project, sections, tasks, revisions }: PortalProjectClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openRevision, setOpenRevision] = useState(false);

  const handleRevision = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createRevisionRequest(project.id, formData);
      if (res.error) throw new Error(res.error);
      toast.success("Revizyon talebiniz başarıyla iletildi.");
      setOpenRevision(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Revizyon talebi oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRevisions = revisions.filter((revision) => revision.status === 'pending' || revision.status === 'in_progress').length;
  const hasRevisionQuota = project.can_request_revision;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          {project.description && <p className="text-muted-foreground">{project.description}</p>}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1 capitalize text-sm">{project.status}</Badge>
            {hasRevisionQuota ? (
              <Dialog open={openRevision} onOpenChange={setOpenRevision}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shrink-0">
                    <RefreshCw className="h-4 w-4" /> Revizyon Talep Et
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleRevision}>
                    <DialogHeader>
                      <DialogTitle>Yeni Revizyon Talebi</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      {pendingRevisions > 0 && (
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-md text-sm border border-amber-500/20">
                          Şu anda sonuçlanmamış {pendingRevisions} adet revizyon talebiniz var. Yeni bir tane eklemek istediğinize emin misiniz?
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="revision-description">Lütfen yapılmasını istediğiniz değişiklikleri detaylıca açıklayın</Label>
                        <Textarea id="revision-description" name="description" required rows={5} placeholder="Şu kısmın rengi mavi olabilir mi? Ayrıca metinleri güncelleyelim..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setOpenRevision(false)}>İptal</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Talebi Gönder
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button disabled className="gap-2 shrink-0 opacity-50">
                <RefreshCw className="h-4 w-4" /> Revizyon Hakkı Bitti
              </Button>
            )}
          </div>
          {project.due_date && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Teslim: {format(new Date(project.due_date), 'd MMM yyyy', { locale: tr })}</span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
          <TabsTrigger value="overview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-transparent">
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="plan" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-transparent">
            Plan & Aşamalar
          </TabsTrigger>
          <TabsTrigger value="revisions" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-transparent flex items-center gap-2">
            Revizyonlar
            {pendingRevisions > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{pendingRevisions}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold">İlerleme Durumu</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-3xl font-bold">
                    <span>%{project.progress}</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Projenizin anlık tamamlanma oranı.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Yapılan İşler
                </h3>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Listelenecek görev bulunmuyor.</p>
                ) : (
                  <ul className="space-y-3 max-h-60 overflow-y-auto tiny-scrollbar pr-2">
                    {tasks.map((task) => (
                      <li key={task.id} className="text-sm flex gap-3 p-2 rounded hover:bg-muted/30 transition-colors">
                        {task.status === 'done' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={task.status === 'done' ? "text-muted-foreground" : "text-foreground font-medium"}>
                            {task.title}
                          </span>
                          {task.date && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(new Date(task.date), 'd MMM yyyy', { locale: tr })}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          {sections.length === 0 ? (
            <div className="py-10 text-center border rounded-lg border-dashed text-muted-foreground">
              Henüz bir plan yüklenmemiş.
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{section.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {section.type === 'milestone' ? 'Aşama' : section.type === 'deliverable' ? 'Teslimat' : 'Not'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="revisions" className="mt-6">
          <div className="flex items-center justify-end mb-4">
            <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
              Kalan Hak: <span className="text-foreground ml-1">{project.revision_quota !== null ? project.revision_quota : 'Sınırsız'}</span>
            </div>
          </div>
          
          {revisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 border rounded-lg border-dashed text-muted-foreground">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              <p>Henüz bir revizyon talebi oluşturmadınız.</p>
              {hasRevisionQuota && (
                <Button variant="outline" size="sm" onClick={() => setOpenRevision(true)}>Yeni Talep Oluştur</Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((rev) => (
                <Card key={rev.id} className="transition-colors hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(rev.created_at), "d MMM yyyy, HH:mm", { locale: tr })}
                      </div>
                      <Badge variant={
                        rev.status === 'completed' ? 'default' : 
                        rev.status === 'rejected' ? 'destructive' : 'secondary'
                      } className="capitalize">
                        {rev.status === 'pending' ? 'Bekliyor' : 
                         rev.status === 'in_progress' ? 'İşleniyor' : 
                         rev.status === 'completed' ? 'Tamamlandı' : 'Reddedildi'}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{rev.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
