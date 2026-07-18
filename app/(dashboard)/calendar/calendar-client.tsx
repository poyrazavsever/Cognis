"use client";

import {
  createCalendarEventRecord,
  deleteCalendarEventRecord,
  updateCalendarEventRecord,
} from "@/app/(dashboard)/calendar/actions";
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
  toast,
} from "poyraz-ui/molecules";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export type CalendarRelationOption = {
  id: string;
  name: string;
};

export type CalendarTaskOption = {
  id: string;
  title: string;
};

export type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  type: "meeting" | "focus" | "deadline" | "personal" | "finance";
  starts_at: string;
  ends_at: string | null;
  client_id: string | null;
  project_id: string | null;
  task_id: string | null;
  clientName: string | null;
  projectName: string | null;
  taskTitle: string | null;
};

const typeLabels = {
  meeting: "Toplantı",
  focus: "Odak",
  deadline: "Deadline",
  personal: "Kişisel",
  finance: "Finans",
};

const typeClasses = {
  meeting: "border-blue-200 bg-blue-50 text-blue-700",
  focus: "border-emerald-200 bg-emerald-50 text-emerald-700",
  deadline: "border-rose-200 bg-rose-50 text-rose-700",
  personal: "border-amber-200 bg-amber-50 text-amber-700",
  finance: "border-primary/20 bg-primary/10 text-primary",
};

type CalendarClientProps = {
  events: CalendarEventItem[];
  clients: CalendarRelationOption[];
  projects: CalendarRelationOption[];
  tasks: CalendarTaskOption[];
};

export function CalendarClient({ events, clients, projects, tasks }: CalendarClientProps) {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const days = useMemo(() => buildMonthDays(monthDate), [monthDate]);
  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);
  const selectedEvents = eventsByDay.get(selectedDate) || [];
  const upcomingEvents = events
    .filter((event) => new Date(event.starts_at) >= startOfToday())
    .slice(0, 6);

  function shiftMonth(amount: number) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">Takvim</h1>
        </div>

        <CalendarEventDialog
          mode="create"
          defaultDate={selectedDate}
          clients={clients}
          projects={projects}
          tasks={tasks}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {formatMonth(monthDate)}
                </h2>
                <p className="text-sm text-muted-foreground">{events.length} etkinlik</p>
              </div>
              <div className="flex gap-2">
                <Button effect="shine" type="button" variant="secondary" onClick={() => shiftMonth(-1)}>
                  Önceki
                </Button>
                <Button effect="shine" type="button" variant="secondary" onClick={() => setMonthDate(new Date())}>
                  Bugün
                </Button>
                <Button effect="shine" type="button" variant="secondary" onClick={() => shiftMonth(1)}>
                  Sonraki
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-7 border border-border text-center text-xs font-medium uppercase text-muted-foreground">
                  {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                    <div key={day} className="border-r border-border px-2 py-2 last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 border-x border-border">
              {days.map((day) => {
                const dayEvents = eventsByDay.get(day.key) || [];
                const isSelected = selectedDate === day.key;

                return (
                  <Button effect="shine"
                    key={day.key}
                    type="button"
                    variant={isSelected ? "default" : "secondary"}
                    onClick={() => setSelectedDate(day.key)}
                    radius="none"
                    className={`min-h-28 w-full justify-start whitespace-normal border-b border-r p-2 text-left last:border-r-0 ${
                      !day.inMonth ? "opacity-60" : ""
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">{day.date.getDate()}</span>
                      {toDateKey(day.date) === toDateKey(new Date()) ? (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    <div className="tiny-scrollbar max-h-20 space-y-1 overflow-y-auto">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="truncate rounded-sm bg-primary/10 px-1.5 py-1 text-xs text-primary">
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 ? (
                        <div className="text-xs text-muted-foreground">+{dayEvents.length - 3}</div>
                      ) : null}
                    </div>
                  </Button>
                );
              })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {formatDateLabel(selectedDate)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedEvents.length} etkinlik
                </p>
              </div>
              <CalendarEventDialog
                mode="create"
                defaultDate={selectedDate}
                clients={clients}
                projects={projects}
                tasks={tasks}
              />
              <EventList events={selectedEvents} clients={clients} projects={projects} tasks={tasks} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <h2 className="text-base font-semibold text-foreground">Yaklaşan etkinlikler</h2>
              <EventList events={upcomingEvents} clients={clients} projects={projects} tasks={tasks} compact />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EventList({
  events,
  clients,
  projects,
  tasks,
  compact = false,
}: {
  events: CalendarEventItem[];
  clients: CalendarRelationOption[];
  projects: CalendarRelationOption[];
  tasks: CalendarTaskOption[];
  compact?: boolean;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Etkinlik yok.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="rounded-sm border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{event.title}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatTimeRange(event)}
              </div>
              {!compact ? (
                <div className="mt-2 text-sm text-muted-foreground">
                  {event.projectName || event.clientName || event.taskTitle || event.description || "Bağlantı yok"}
                </div>
              ) : null}
            </div>
            <Badge className={typeClasses[event.type]}>{typeLabels[event.type]}</Badge>
          </div>
          {!compact ? (
            <div className="mt-3 flex gap-2">
              <CalendarEventDialog mode="edit" event={event} clients={clients} projects={projects} tasks={tasks} />
              <form action={deleteCalendarEventRecord}>
                <input type="hidden" name="id" value={event.id} />
                <Button effect="shine" type="submit" variant="secondary" className="gap-2 text-rose-600">
                  <Trash2 className="h-4 w-4" />
                  Sil
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CalendarEventDialog({
  mode,
  event,
  defaultDate,
  clients,
  projects,
  tasks,
}: {
  mode: "create" | "edit";
  event?: CalendarEventItem;
  defaultDate?: string;
  clients: CalendarRelationOption[];
  projects: CalendarRelationOption[];
  tasks: CalendarTaskOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = mode === "create" ? createCalendarEventRecord : updateCalendarEventRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      await action(formData);
      setOpen(false);
      toast.success(mode === "create" ? "Etkinlik eklendi." : "Etkinlik güncellendi.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Etkinlik kaydedilirken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine" className="gap-2" variant={mode === "create" ? "default" : "secondary"}>
          {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {mode === "create" ? "Etkinlik ekle" : "Düzenle"}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(680px,calc(100dvh-4rem))] sm:max-w-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {event ? <input type="hidden" name="id" value={event.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>{mode === "create" ? "Yeni etkinlik" : "Etkinliği düzenle"}</DialogTitle>
            <DialogDescription>Takvim etkinliğini proje, görev veya müşteriyle ilişkilendir.</DialogDescription>
          </DialogHeader>

          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <EventFormFields event={event} defaultDate={defaultDate} clients={clients} projects={projects} tasks={tasks} />
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
              {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {isSubmitting ? "Kaydediliyor" : mode === "create" ? "Etkinliği ekle" : "Değişiklikleri kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EventFormFields({
  event,
  defaultDate,
  clients,
  projects,
  tasks,
}: {
  event?: CalendarEventItem;
  defaultDate?: string;
  clients: CalendarRelationOption[];
  projects: CalendarRelationOption[];
  tasks: CalendarTaskOption[];
}) {
  const startsAt = event?.starts_at ? toDateTimeLocal(event.starts_at) : `${defaultDate || toDateKey(new Date())}T09:00`;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>Başlık</Label>
        <Input name="title" defaultValue={event?.title || ""} required placeholder="Örn. Müşteri toplantısı" />
      </div>
      <div className="grid gap-2">
        <Label>Açıklama</Label>
        <Textarea name="description" defaultValue={event?.description || ""} rows={3} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="type" label="Tür" defaultValue={event?.type || "focus"}>
          <SelectItem value="meeting">Toplantı</SelectItem>
          <SelectItem value="focus">Odak</SelectItem>
          <SelectItem value="deadline">Deadline</SelectItem>
          <SelectItem value="personal">Kişisel</SelectItem>
          <SelectItem value="finance">Finans</SelectItem>
        </SelectField>
        <SelectField name="client_id" label="Müşteri" defaultValue={event?.client_id || "__none"}>
          <SelectItem value="__none">Müşteri yok</SelectItem>
          {clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
        </SelectField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="project_id" label="Proje" defaultValue={event?.project_id || "__none"}>
          <SelectItem value="__none">Proje yok</SelectItem>
          {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
        </SelectField>
        <SelectField name="task_id" label="Görev" defaultValue={event?.task_id || "__none"}>
          <SelectItem value="__none">Görev yok</SelectItem>
          {tasks.map((task) => <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>)}
        </SelectField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Başlangıç</Label>
          <Input name="starts_at" type="datetime-local" defaultValue={startsAt} required />
        </div>
        <div className="grid gap-2">
          <Label>Bitiş</Label>
          <Input name="ends_at" type="datetime-local" defaultValue={event?.ends_at ? toDateTimeLocal(event.ends_at) : ""} />
        </div>
      </div>
    </div>
  );
}

function SelectField({ name, label, defaultValue, children }: { name: string; label: string; defaultValue: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger><SelectValue placeholder={`${label} seç`} /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function buildMonthDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, key: toDateKey(date), inMonth: date.getMonth() === month };
  });
}

function groupEventsByDay(events: CalendarEventItem[]) {
  const map = new Map<string, CalendarEventItem[]>();
  for (const event of events) {
    const key = toDateKey(new Date(event.starts_at));
    map.set(key, [...(map.get(key) || []), event]);
  }
  return map;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(date);
}

function formatDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${dateKey}T00:00:00`));
}

function formatTimeRange(event: CalendarEventItem) {
  const start = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.starts_at));
  const end = event.ends_at ? new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.ends_at)) : null;
  return end ? `${start} - ${end}` : start;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}
