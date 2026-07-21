"use client";

import { useState } from "react";
import { format } from "date-fns";
import { getDocumentDateFnsLocale } from "@/lib/i18n/date-fns";
import { Card, CardContent, Badge, Button, Input, Textarea, Label } from "poyraz-ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, DialogDescription, Tabs, TabsList, TabsTrigger, TabsContent } from "poyraz-ui/molecules";
import { Phone, Mail, ExternalLink, Calendar, Plus, MessageSquare, UserPlus, Loader2, Copy } from "lucide-react";
import { toast } from "poyraz-ui/molecules";
import { addClientActivity } from "./actions";
import { useTranslations } from "@/components/i18n/i18n-provider";

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
  portal_locale: string;
  translations?: Record<string, Record<string, string>>;
};

export type ClientActivity = {
  id: string;
  type: "note" | "call" | "meeting" | "email";
  title: string;
  content: string | null;
  activity_date: string;
  created_at: string;
  translations?: Record<string, Record<string, string>>;
};

export function ClientDetailClient({
  client,
  activities,
  locales,
  currentLocale,
}: {
  client: ClientDetailData;
  activities: ClientActivity[];
  locales: Array<{ code: string; nativeName: string; name: string }>;
  currentLocale: string;
}) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [portalLocale, setPortalLocale] = useState(client.portal_locale);
  const t = useTranslations();

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
      case "call": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t("clients.detail.activityTypes.call")}</Badge>;
      case "meeting": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t("clients.detail.activityTypes.meeting")}</Badge>;
      case "email": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{t("clients.detail.activityTypes.email")}</Badge>;
      default: return <Badge variant="secondary">{t("clients.detail.activityTypes.note")}</Badge>;
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
    const locale = formData.get("locale") as string;
    
    setIsCreatingUser(true);
    try {
      const res = await fetch("/api/create-client-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, client_id: client.id, locale })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "clients.detail.portalInviteFailed");
      }
      setInvitationUrl(data.invitation.invitationUrl);
      setPortalLocale(data.invitation.locale ?? locale);
      toast.success(t("clients.detail.portalInviteCreated"));
    } catch (error: unknown) {
      toast.error(resolveTranslatedError(t, error, "clients.detail.portalInviteFailed"));
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function handlePortalLocaleChange(nextLocale: string) {
    setPortalLocale(nextLocale);
    try {
      const response = await fetch(`/api/portal-clients/${client.id}/locale`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "clients.detail.portalLocaleUpdateFailed");
      toast.success(t("clients.detail.portalLocaleUpdated"));
    } catch (error) {
      setPortalLocale(client.portal_locale);
      toast.error(resolveTranslatedError(t, error, "clients.detail.portalLocaleUpdateFailed"));
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
                <Button effect="shine" variant="secondary" size="sm" className="gap-2 ml-2 border-dashed">
                  <UserPlus className="h-4 w-4" /> {t("clients.detail.createPortalAccount")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>{t("clients.detail.invitePortal")}</DialogTitle>
                    <DialogDescription>
                      {t("clients.detail.portalInviteDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("clients.form.email")}</Label>
                      <Input id="email" name="email" type="email" required defaultValue={client.email || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("clients.detail.portalLocale")}</Label>
                      <Select name="locale" defaultValue={portalLocale}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("clients.detail.portalLocalePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {locales.map((locale) => (
                            <SelectItem key={locale.code} value={locale.code}>
                              {locale.nativeName || locale.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {invitationUrl ? (
                      <div className="space-y-2">
                        <Label htmlFor="invitation-url">{t("clients.detail.invitationUrl")}</Label>
                        <div className="flex gap-2">
                          <Input id="invitation-url" value={invitationUrl} readOnly />
                          <Button effect="shine"
                            type="button"
                            variant="secondary"
                            size="icon"
                            aria-label={t("clients.detail.copyInvitationUrl")}
                            onClick={async () => {
                              await navigator.clipboard.writeText(invitationUrl);
                              toast.success(t("clients.detail.invitationUrlCopied"));
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("clients.detail.invitationUrlHelp")}</p>
                      </div>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button effect="shine" type="button" variant="secondary" onClick={() => setCreateUserOpen(false)}>{t("clients.form.cancel")}</Button>
                    <Button variant="default" effect="shine" type="submit" disabled={isCreatingUser || Boolean(invitationUrl)}>
                      {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("clients.detail.createInvitation")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {client.client_auth_id && (
            <>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-sm flex items-center gap-1.5 ml-2">
                <UserPlus className="h-3.5 w-3.5" /> {t("clients.detail.portalActive")}
              </Badge>
              <Select value={portalLocale} onValueChange={handlePortalLocaleChange}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue placeholder={t("clients.detail.portalLocalePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((locale) => (
                    <SelectItem key={locale.code} value={locale.code}>
                      {locale.nativeName || locale.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Contact & Details */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground">{t("clients.detail.contactInfo")}</h3>
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
                  <p className="text-muted-foreground italic">{t("clients.detail.noContact")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground">{t("clients.form.notes")}</h3>
              {client.notes ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t("clients.detail.noNotes")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activities & Timeline */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">{t("clients.detail.activityHistory")}</h3>
                
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button variant="default" effect="shine" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> {t("clients.detail.addActivity")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form action={handleAddActivity} className="space-y-4">
                      <DialogHeader>
                        <DialogTitle>{t("clients.detail.addActivity")}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>{t("clients.detail.activityType")}</Label>
                          <Select name="type" defaultValue="note">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="note">{t("clients.detail.activityTypes.note")}</SelectItem>
                              <SelectItem value="call">{t("clients.detail.activityTypes.call")}</SelectItem>
                              <SelectItem value="meeting">{t("clients.detail.activityTypes.meeting")}</SelectItem>
                              <SelectItem value="email">{t("clients.detail.activityTypes.email")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>{t("clients.detail.activityDate")}</Label>
                          <Input name="activity_date" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
                        </div>
                        <Tabs defaultValue={locales[0].code}>
                          <TabsList className="mb-4">
                            {locales.map((locale) => (
                              <TabsTrigger key={locale.code} value={locale.code}>{locale.name}</TabsTrigger>
                            ))}
                          </TabsList>
                          {locales.map((locale) => (
                            <TabsContent key={locale.code} value={locale.code} className="space-y-4">
                              <div className="grid gap-2">
                                <Label>{t("clients.detail.activityTitle")} ({locale.code})</Label>
                                <Input name={`i18n.${locale.code}.title`} required={locale.code === locales[0].code} />
                              </div>
                              <div className="grid gap-2">
                                <Label>{t("clients.detail.activityContent")} ({locale.code})</Label>
                                <Textarea name={`i18n.${locale.code}.content`} rows={4} />
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                      <DialogFooter>
                        <Button variant="default" effect="shine" type="submit" disabled={isAddingActivity}>
                          {isAddingActivity ? "..." : t("clients.detail.saveActivity")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {activities.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">{t("clients.detail.emptyActivities")}</p>
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
                            <h4 className="font-semibold text-foreground">{activity.translations?.[currentLocale]?.title ?? activity.title}</h4>
                            {getActivityBadge(activity.type)}
                          </div>
                          <time className="text-xs text-muted-foreground block mb-2 font-medium">
                            {format(new Date(activity.activity_date), "d MMM yyyy, HH:mm", { locale: getDocumentDateFnsLocale() })}
                          </time>
                          {(activity.translations?.[currentLocale]?.content ?? activity.content) && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.translations?.[currentLocale]?.content ?? activity.content}</p>
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

function resolveTranslatedError(
  t: ReturnType<typeof useTranslations>,
  error: unknown,
  fallbackKey: string,
) {
  if (!(error instanceof Error)) return t(fallbackKey);
  if (/^clients\./.test(error.message)) return t(error.message);
  return error.message || t(fallbackKey);
}
