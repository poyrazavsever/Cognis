"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, Badge, Button, Input, Textarea, Label } from "poyraz-ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, DialogDescription } from "poyraz-ui/molecules";
import { Phone, Mail, ExternalLink, Calendar, Plus, MessageSquare, UserPlus, Loader2, Copy } from "lucide-react";
import { toast } from "poyraz-ui/molecules";
import { addClientActivity } from "./actions";

export type ClientDetailData = {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  pipeline_stage: string;
  status: string;
  notes: string | null;
  client_auth_id: string | null;
};

export type ClientActivity = {
  id: string;
  type: "note" | "call" | "meeting" | "email";
  title: string;
  content: string | null;
  activity_date: string;
  created_at: string;
};

export function ClientDetailClient({ client, activities }: { client: ClientDetailData; activities: ClientActivity[] }) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="h-4 w-4 text-blue-500" />;
      case "meeting": return <Calendar className="h-4 w-4 text-emerald-500" />;
      case "email": return <Mail className="h-4 w-4 text-amber-500" />;
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "call": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Arama</Badge>;
      case "meeting": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Toplantı</Badge>;
      case "email": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">E-posta</Badge>;
      default: return <Badge variant="secondary">Not</Badge>;
    }
  };

  async function handleAddActivity(formData: FormData) {
    setIsAddingActivity(true);
    try {
      await addClientActivity(client.id, formData);
      setOpenDialog(false);
    } finally {
      setIsAddingActivity(false);
    }
  }

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    
    setIsCreatingUser(true);
    try {
      const res = await fetch("/api/create-client-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, client_id: client.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Kullanıcı oluşturulamadı.");
      }
      setInvitationUrl(data.invitation.invitationUrl);
      toast.success("Güvenli portal daveti oluşturuldu.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Davet oluşturulamadı.");
    } finally {
      setIsCreatingUser(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl font-semibold text-primary">
            {client.name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase()).join("")}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
            {client.company_name && <p className="text-muted-foreground mt-1">{client.company_name}</p>}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="px-3 py-1 capitalize text-sm">{client.status}</Badge>
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1 capitalize text-sm">
            {client.pipeline_stage.replace('_', ' ')}
          </Badge>
          {!client.client_auth_id && (
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 ml-2 border-dashed">
                  <UserPlus className="h-4 w-4" /> Portal Hesabı Aç
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>Müşteri Portalına Davet Et</DialogTitle>
                    <DialogDescription>
                      Müşterin bağlantıyı açıp kendi şifresini belirler. Davet 72 saat geçerlidir ve yalnızca bir kez kullanılabilir.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta Adresi</Label>
                      <Input id="email" name="email" type="email" required defaultValue={client.email || ""} />
                    </div>
                    {invitationUrl ? (
                      <div className="space-y-2">
                        <Label htmlFor="invitation-url">Davet bağlantısı</Label>
                        <div className="flex gap-2">
                          <Input id="invitation-url" value={invitationUrl} readOnly />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Davet bağlantısını kopyala"
                            onClick={async () => {
                              await navigator.clipboard.writeText(invitationUrl);
                              toast.success("Davet bağlantısı kopyalandı.");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Bağlantı yalnızca bu ekranda düz metin olarak gösterilir.</p>
                      </div>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setCreateUserOpen(false)}>İptal</Button>
                    <Button type="submit" disabled={isCreatingUser || Boolean(invitationUrl)}>
                      {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Davet Oluştur
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {client.client_auth_id && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-sm flex items-center gap-1.5 ml-2">
              <UserPlus className="h-3.5 w-3.5" /> Portal Aktif
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Contact & Details */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground">İletişim Bilgileri</h3>
              <div className="space-y-3 text-sm">
                {client.email ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors">{client.email}</a>
                  </div>
                ) : null}
                {client.phone ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <a href={`tel:${client.phone}`} className="hover:text-primary transition-colors">{client.phone}</a>
                  </div>
                ) : null}
                {client.website ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <a href={client.website} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                      {client.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                ) : null}
                {!client.email && !client.phone && !client.website && (
                  <p className="text-muted-foreground italic">İletişim bilgisi girilmemiş.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Genel Notlar</h3>
              {client.notes ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Müşteriye ait genel not bulunmuyor.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activities & Timeline */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Aktivite Geçmişi</h3>
                
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Aktivite Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form action={handleAddActivity} className="space-y-4">
                      <DialogHeader>
                        <DialogTitle>Yeni Aktivite Ekle</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Tip</Label>
                          <Select name="type" defaultValue="note">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="note">Not</SelectItem>
                              <SelectItem value="call">Arama</SelectItem>
                              <SelectItem value="meeting">Toplantı</SelectItem>
                              <SelectItem value="email">E-posta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Başlık</Label>
                          <Input name="title" required placeholder="Aktivite özeti" />
                        </div>
                        <div className="grid gap-2">
                          <Label>Tarih</Label>
                          <Input name="activity_date" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
                        </div>
                        <div className="grid gap-2">
                          <Label>İçerik (Opsiyonel)</Label>
                          <Textarea name="content" rows={4} placeholder="Görüşme detayları..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isAddingActivity}>
                          {isAddingActivity ? "Ekleniyor..." : "Ekle"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {activities.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Henüz kaydedilmiş bir aktivite yok.</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted/50 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {getActivityIcon(activity.type)}
                      </div>
                      {/* Card */}
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-foreground">{activity.title}</h4>
                            {getActivityBadge(activity.type)}
                          </div>
                          <time className="text-xs text-muted-foreground block mb-2 font-medium">
                            {format(new Date(activity.activity_date), "d MMM yyyy, HH:mm", { locale: tr })}
                          </time>
                          {activity.content && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.content}</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
