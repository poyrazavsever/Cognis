"use client";

import { getDocumentIntlLocale } from "@/lib/i18n/browser";
import { useTranslations } from "@/components/i18n/i18n-provider";
import {
  createClientRecord,
  updateClientRecord,
  updateClientPipelineStage,
} from "@/app/(dashboard)/clients/actions";
import { PendingLink } from "@/components/ui/pending-link";
import { Badge, Button, Card, CardContent, Input, Label, Textarea } from "poyraz-ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "poyraz-ui/molecules";
import {
  Mail,
  Pencil,
  Phone,
  Plus,
  UserCheck,
  Users,
  Wallet,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { getDocumentDateFnsLocale } from "@/lib/i18n/date-fns";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/system/stat-card";

export type ClientListItem = {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: "active" | "paused" | "archived";
  notes: string | null;
  created_at: string;
  projectCount: number;
  revenueTotal: number;
  // CRM fields
  pipeline_stage: "lead" | "contacted" | "proposal_sent" | "won" | "lost";
  next_follow_up_date: string | null;
  last_contact_date: string | null;
  client_value_score: number;
  translations?: Record<string, Record<string, string>>;
};

type ClientPipelineStage = ClientListItem["pipeline_stage"];

const pipelineStages: Array<{
  id: ClientPipelineStage;
  label: string;
  color: string;
}> = [
  { id: "lead", label: "Potansiyel (Lead)", color: "border-slate-200 bg-slate-50 text-slate-700" },
  { id: "contacted", label: "İletişime Geçildi", color: "border-blue-200 bg-blue-50 text-blue-700" },
  { id: "proposal_sent", label: "Teklif İletildi", color: "border-amber-200 bg-amber-50 text-amber-700" },
  { id: "won", label: "Kazanıldı (Won)", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { id: "lost", label: "Kaybedildi (Lost)", color: "border-rose-200 bg-rose-50 text-rose-700" },
];

type ClientsClientProps = {
  clients: ClientListItem[];
  totalRevenue: number;
  activeCount: number;
  activeLocales: { code: string; name: string }[];
};

export function ClientsClient({
  clients,
  totalRevenue,
  activeCount,
  activeLocales,
}: ClientsClientProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [pipelineOverrides, setPipelineOverrides] = useState<
    Partial<Record<string, ClientPipelineStage>>
  >({});
  const localClients = clients.map((client) => ({
    ...client,
    pipeline_stage: pipelineOverrides[client.id] ?? client.pipeline_stage,
  }));

  function handleDragStart(event: React.DragEvent<HTMLDivElement>, clientId: string) {
    setDraggedClientId(clientId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", clientId);
  }

  async function handleDrop(newStage: ClientPipelineStage) {
    if (!draggedClientId) return;

    const clientId = draggedClientId;
    setDraggedClientId(null);

    const client = localClients.find(c => c.id === clientId);
    if (!client || client.pipeline_stage === newStage) return;

    const previousStage = client.pipeline_stage;
    setPipelineOverrides((current) => ({ ...current, [clientId]: newStage }));

    try {
      await updateClientPipelineStage(clientId, newStage);
      toast.success(t("clients.messages.stageUpdated"));
    } catch (error) {
      setPipelineOverrides((current) => ({
        ...current,
        [clientId]: previousStage,
      }));
      toast.error(
        error instanceof Error
          ? error.message
          : t("clients.errors.stageUpdateFailed"),
      );
    }
  }

  const filteredClients = normalizedQuery
    ? localClients.filter((client) =>
        [
          client.name,
          client.company_name,
          client.email,
          client.phone,
          client.website,
          client.notes,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
      )
    : localClients;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            {t("clients.title")}
          </h1>
        </div>

        <ClientDialog mode="create" activeLocales={activeLocales} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard
          label={t("clients.stats.lead")}
          value={clients.filter(c => c.pipeline_stage === 'lead' || c.pipeline_stage === 'contacted').length.toString()}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label={t("clients.stats.active")}
          value={activeCount.toString()}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label={t("clients.stats.followUp")}
          value={clients.filter(c => c.next_follow_up_date && (isPast(new Date(c.next_follow_up_date)) || isToday(new Date(c.next_follow_up_date)))).length.toString()}
          icon={Clock}
          tone="rose"
        />
        <StatCard
          label={t("clients.stats.revenue")}
          value={formatCurrency(totalRevenue)}
          description={t("clients.stats.revenueDesc")}
          icon={Wallet}
          tone="primary"
        />
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="pipeline">{t("clients.tabs.pipeline")}</TabsTrigger>
            <TabsTrigger value="list">{t("clients.tabs.list")}</TabsTrigger>
          </TabsList>
          
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("clients.search")}
            className="md:max-w-sm"
          />
        </div>

        <TabsContent value="pipeline" className="mt-0">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {pipelineStages.map(stage => {
              const stageClients = filteredClients.filter(c => c.pipeline_stage === stage.id && c.status !== 'archived');
              return (
                <DroppableColumn 
                  key={stage.id} 
                  title={t(`clients.pipeline.${stage.id}` as any)} 
                  count={stageClients.length} 
                  color={stage.color.split(' ')[1]}
                  onDrop={() => handleDrop(stage.id)}
                >
                  {stageClients.map(client => (
                    <DraggableClientCard 
                      key={client.id} 
                      client={client} 
                      draggedClientId={draggedClientId}
                      onDragStart={handleDragStart}
                      onDragEnd={() => setDraggedClientId(null)}
                    />
                  ))}
                  {stageClients.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-border rounded-md text-xs text-muted-foreground">
                      {t("clients.empty.pipeline")}
                    </div>
                  )}
                </DroppableColumn>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          {filteredClients.length > 0 ? (
            <div className="overflow-x-auto rounded-sm border border-border">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  <span>{t("clients.list.client")}</span>
                  <span>{t("clients.list.contact")}</span>
                  <span>{t("clients.list.stage")}</span>
                  <span>{t("clients.list.followUp")}</span>
                  <span>Finans</span>
                  <span className="text-right">İşlem</span>
                </div>
                <div className="divide-y divide-border">
                  {filteredClients.map(client => (
                    <ClientRow key={client.id} client={client} activeLocales={activeLocales} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState hasQuery={query.length > 0} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DroppableColumn({ title, count, color, onDrop, children }: { title: string, count: number, color: string, onDrop: () => void, children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-[340px] px-2 flex flex-col h-[calc(100vh-320px)] min-h-[500px] transition-colors rounded-lg"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`}></span>
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 tiny-scrollbar">
        {children}
      </div>
    </div>
  );
}

function DraggableClientCard({ 
  client, 
  draggedClientId,
  onDragStart,
  onDragEnd 
}: { 
  client: ClientListItem, 
  draggedClientId: string | null,
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void,
  onDragEnd: () => void 
}) {
  const isDragging = draggedClientId === client.id;

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, client.id)}
      onDragEnd={onDragEnd}
      className={cn("touch-none", isDragging ? "cursor-grabbing opacity-50 ring-2 ring-primary/20 transition" : "cursor-grab transition active:cursor-grabbing")}
    >
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <PendingLink href={`/clients/${client.id}`} className="font-medium text-foreground hover:underline inline-flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()} showSpinner>
              {client.name}
            </PendingLink>
            <div onPointerDown={(e) => e.stopPropagation()}>
              <ClientDialog mode="edit" client={client} activeLocales={[{code: "dummy", name: "dummy"}]} trigger={<Button size="icon-sm" effect="shine" variant="secondary" ><Pencil className="h-3 w-3" /></Button>} />
            </div>
          </div>
          {client.company_name && <p className="text-xs text-muted-foreground mb-2 pointer-events-none">{client.company_name}</p>}
          
          {client.next_follow_up_date && (
            <div className="mt-3 flex items-center gap-1.5 text-xs pointer-events-none">
              <Clock className={`h-3 w-3 ${isPast(new Date(client.next_follow_up_date)) ? 'text-rose-500' : 'text-muted-foreground'}`} />
              <span className={isPast(new Date(client.next_follow_up_date)) ? 'text-rose-500 font-medium' : 'text-muted-foreground'}>
                {format(new Date(client.next_follow_up_date), 'd MMM yyyy', { locale: getDocumentDateFnsLocale() })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClientRow({ client, activeLocales }: { client: ClientListItem, activeLocales: { code: string; name: string }[] }) {
  const t = useTranslations();
  const isFollowUpOverdue = client.next_follow_up_date && (isPast(new Date(client.next_follow_up_date)) || isToday(new Date(client.next_follow_up_date)));
  const stage = pipelineStages.find(s => s.id === client.pipeline_stage) || pipelineStages[0];

  return (
    <div className="grid gap-4 px-4 py-4 grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.8fr] items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(client.name)}
          </div>
          <div className="min-w-0">
            <PendingLink href={`/clients/${client.id}`} className="truncate font-medium text-foreground hover:underline flex items-center gap-1.5" showSpinner>{client.name}</PendingLink>
            <div className="truncate text-sm text-muted-foreground">
              {client.company_name || t("clients.list.noCompany")}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        {client.email ? (
          <Link href={`mailto:${client.email}`} className="flex items-center gap-2 hover:text-primary">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{client.email}</span>
          </Link>
        ) : null}
        {client.phone ? (
          <Link href={`tel:${client.phone}`} className="flex items-center gap-2 hover:text-primary">
            <Phone className="h-3.5 w-3.5" />
            <span className="truncate">{client.phone}</span>
          </Link>
        ) : null}
        {!client.email && !client.phone && !client.website ? (
          <span>{t("clients.list.noContact")}</span>
        ) : null}
      </div>

      <div>
        <Badge className={stage.color}>
          {t(`clients.pipeline.${stage.id}` as any)}
        </Badge>
      </div>

      <div className="text-sm">
        {client.next_follow_up_date ? (
          <div className={`flex items-center gap-1.5 ${isFollowUpOverdue ? 'text-rose-600 font-medium' : 'text-muted-foreground'}`}>
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(client.next_follow_up_date), 'd MMM yyyy', { locale: getDocumentDateFnsLocale() })}
          </div>
        ) : (
          <span className="text-muted-foreground opacity-50">-</span>
        )}
      </div>

      <div className="text-sm">
        <div className="font-medium text-foreground">{client.projectCount} {t("clients.list.projects")}</div>
        <div className="text-muted-foreground">{formatCurrency(client.revenueTotal)}</div>
      </div>

      <div className="flex justify-end gap-2">
        <PendingLink href={`/clients/${client.id}`} className="inline-flex" showSpinner>
          <Button size="icon" effect="shine" variant="secondary" >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </PendingLink>
        <ClientDialog mode="edit" client={client} activeLocales={activeLocales} trigger={<Button effect="shine" variant="secondary" className="min-w-20 gap-2 px-3"><Pencil className="h-4 w-4" /> {t("clients.actions.edit")}</Button>} />
      </div>
    </div>
  );
}

function ClientDialog({
  mode,
  client,
  trigger,
  activeLocales
}: {
  mode: "create" | "edit";
  client?: ClientListItem;
  trigger?: React.ReactNode;
  activeLocales: { code: string; name: string }[];
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = mode === "create" ? createClientRecord : updateClientRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      await action(formData);
      setOpen(false);
      toast.success(mode === "create" ? t("clients.messages.created") : t("clients.messages.updated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("clients.errors.saveFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button effect="shine"
            variant={mode === "create" ? "default" : "secondary"}
            className="min-w-24 gap-2 px-3"
          >
            {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {mode === "create" ? t("clients.actions.add") : t("clients.actions.edit")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(680px,calc(100dvh-4rem))] sm:max-w-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {client ? <input type="hidden" name="id" value={client.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>
              {mode === "create" ? t("clients.form.createTitle") : t("clients.form.editTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("clients.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <ClientFormFields client={client} activeLocales={activeLocales} />
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
              {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {isSubmitting
                ? "..."
                : mode === "create"
                  ? t("clients.form.save")
                  : t("clients.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClientFormFields({ client, activeLocales }: { client?: ClientListItem, activeLocales: { code: string; name: string }[] }) {
  const t = useTranslations();
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`name-${client?.id || "new"}`}>{t("clients.form.name")}</Label>
          <Input
            id={`name-${client?.id || "new"}`}
            name="name"
            defaultValue={client?.name || ""}
            required
            placeholder="Örn. Acme Corp"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`company-${client?.id || "new"}`}>{t("clients.form.company")}</Label>
          <Input
            id={`company-${client?.id || "new"}`}
            name="company_name"
            defaultValue={client?.company_name || ""}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 border-t border-border pt-4 mt-2">
        <div className="grid gap-2">
          <Label>{t("clients.form.pipelineStage")}</Label>
          <Select name="pipeline_stage" defaultValue={client?.pipeline_stage || "lead"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map(stage => (
                <SelectItem key={stage.id} value={stage.id}>{t(`clients.pipeline.${stage.id}` as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t("clients.form.status")}</Label>
          <Select name="status" defaultValue={client?.status || "active"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("clients.form.active")}</SelectItem>
              <SelectItem value="paused">{t("clients.form.paused")}</SelectItem>
              <SelectItem value="archived">{t("clients.form.archived")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`followup-${client?.id || "new"}`}>{t("clients.form.followUp")}</Label>
          <Input
            id={`followup-${client?.id || "new"}`}
            name="next_follow_up_date"
            type="date"
            defaultValue={client?.next_follow_up_date ? new Date(client.next_follow_up_date).toISOString().slice(0, 10) : ""}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 border-t border-border pt-4 mt-2">
        <div className="grid gap-2">
          <Label htmlFor={`email-${client?.id || "new"}`}>{t("clients.form.email")}</Label>
          <Input
            id={`email-${client?.id || "new"}`}
            name="email"
            type="email"
            defaultValue={client?.email || ""}
            placeholder="musteri@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`phone-${client?.id || "new"}`}>{t("clients.form.phone")}</Label>
          <PhoneInput
            id={`phone-${client?.id || "new"}`}
            name="phone"
            defaultValue={client?.phone || ""}
          />
        </div>
      </div>

      <div className="grid gap-2 border-t border-border pt-4 mt-2">
        <Tabs defaultValue={activeLocales[0].code}>
          <div className="flex items-center justify-between mb-4">
            <Label>{t("clients.form.notes")}</Label>
            <TabsList>
              {activeLocales.map((locale) => (
                <TabsTrigger key={locale.code} value={locale.code}>{locale.name}</TabsTrigger>
              ))}
            </TabsList>
          </div>
          {activeLocales.map((locale) => (
            <TabsContent key={locale.code} value={locale.code} className="mt-0 space-y-4">
              <Textarea
                name={`i18n.${locale.code}.notes`}
                defaultValue={client?.translations?.[locale.code]?.notes ?? ""}
                rows={4}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function PhoneInput({ id, name, defaultValue }: { id: string; name: string; defaultValue: string; }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Input
      id={id}
      name={name}
      value={value}
      inputMode="tel"
      placeholder="+90 (5xx) xxx xx xx"
      onChange={(event) => setValue(formatPhone(event.target.value))}
    />
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-8 text-center">
      <Users className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {hasQuery ? "Aramana uygun müşteri yok" : "Henüz müşteri eklenmedi"}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        İlk müşterini ekleyerek potansiyel satışlarını takip etmeye başla.
      </p>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  const local = digits.startsWith("90") ? digits.slice(2, 12) : digits.startsWith("0") ? digits.slice(1, 11) : digits.slice(0, 10);
  const area = local.slice(0, 3);
  const first = local.slice(3, 6);
  const second = local.slice(6, 8);
  const third = local.slice(8, 10);
  let formatted = "+90";
  if (area) formatted += ` (${area}`;
  if (area.length === 3) formatted += ")";
  if (first) formatted += ` ${first}`;
  if (second) formatted += ` ${second}`;
  if (third) formatted += ` ${third}`;
  return formatted;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(getDocumentIntlLocale(), { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
