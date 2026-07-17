"use client";

import {
  completeProjectRecord,
  createProjectRecord,
  updateProjectRecord,
} from "@/app/(dashboard)/projects/actions";
import { PendingLink } from "@/components/ui/pending-link";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
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
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FolderKanban,
  ImageIcon,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Target,
  Wallet,
  Brain,
  Loader2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import { StatCard } from "@/components/system/stat-card";

export type ProjectClientOption = {
  id: string;
  name: string;
};

export type ProjectListItem = {
  id: string;
  client_id: string | null;
  clientName: string | null;
  name: string;
  type: "client_project" | "side_project";
  description: string | null;
  status: "planning" | "active" | "paused" | "completed" | "cancelled";
  start_date: string | null;
  due_date: string | null;
  budget_amount: number | null;
  currency: string;
  progress: number;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  coverImageUrl: string | null;
  taskCount: number;
  doneTaskCount: number;
};

const typeLabels = {
  client_project: "Müşteri projesi",
  side_project: "Side project",
};

const statusLabels = {
  planning: "Planlama",
  active: "Aktif",
  paused: "Duraklatıldı",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
};

const statusClasses = {
  planning: "border-blue-200 bg-blue-50 text-blue-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-zinc-200 bg-zinc-50 text-zinc-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

type ProjectsClientProps = {
  projects: ProjectListItem[];
  clients: ProjectClientOption[];
};

export function ProjectsClient({ projects, clients }: ProjectsClientProps) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProjects = normalizedQuery
    ? projects.filter((project) =>
        [project.name, project.description, project.clientName, typeLabels[project.type]]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
      )
    : projects;

  const activeCount = projects.filter((project) => project.status === "active").length;
  const sideProjectCount = projects.filter((project) => project.type === "side_project").length;
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0;
  const totalBudget = projects.reduce((sum, project) => sum + (project.budget_amount || 0), 0);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            Projeler
          </h1>
        </div>

        <div className="flex gap-2">
          <AIProjectRiskDialog />
          <ProjectDialog mode="create" clients={clients} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Aktif proje" value={activeCount.toString()} icon={FolderKanban} tone="green" />
        <StatCard label="Side project" value={sideProjectCount.toString()} icon={Target} tone="blue" />
        <StatCard label="Ortalama ilerleme" value={`${averageProgress}%`} icon={CheckCircle2} tone="amber" />
        <StatCard label="Toplam bütçe" value={formatCurrency(totalBudget)} icon={Wallet} tone="red" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Proje listesi</h2>
              <p className="text-sm text-muted-foreground">
                {filteredProjects.length} kayıt görüntüleniyor.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Proje, müşteri veya açıklama ara"
                className="sm:w-80"
              />
              <div className="flex rounded-sm border border-border p-1">
                <Button size="sm" effect="shine"
                  type="button"
                  variant={view === "grid" ? "default" : "secondary"}
                  className="gap-2 px-3"
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Kart
                </Button>
                <Button size="sm" effect="shine"
                  type="button"
                  variant={view === "list" ? "default" : "secondary"}
                  className="gap-2 px-3"
                  onClick={() => setView("list")}
                >
                  <List className="h-4 w-4" />
                  Liste
                </Button>
              </div>
            </div>
          </div>

          {filteredProjects.length > 0 ? (
            view === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} clients={clients} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-sm border border-border">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    <span>Proje</span>
                    <span>Tür</span>
                    <span>Durum</span>
                    <span>İlerleme</span>
                    <span className="text-right">İşlem</span>
                  </div>
                  <div className="divide-y divide-border">
                    {filteredProjects.map((project) => (
                      <ProjectRow key={project.id} project={project} clients={clients} />
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            <EmptyState hasQuery={Boolean(normalizedQuery)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectCard({
  project,
  clients,
}: {
  project: ProjectListItem;
  clients: ProjectClientOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const detailHref = `/projects/${project.id}`;

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  function goToProjectDetail() {
    setIsNavigating(true);
    router.push(detailHref);
  }

  function prefetchProjectDetail() {
    router.prefetch(detailHref);
  }

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`${project.name} detayına git`}
      aria-busy={isNavigating}
      className={
        isNavigating
          ? "relative cursor-progress opacity-80 transition-colors ring-2 ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "relative cursor-pointer transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      }
      onClick={goToProjectDetail}
      onMouseEnter={prefetchProjectDetail}
      onFocus={prefetchProjectDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goToProjectDetail();
        }
      }}
    >
      <CardContent className="flex h-full flex-col gap-5 p-5">
        {isNavigating ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-sm bg-background/70 backdrop-blur-[1px]">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : null}
        <ProjectCover project={project} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-foreground">{project.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {project.description || "Açıklama eklenmedi."}
            </p>
          </div>
          <Badge className={statusClasses[project.status]}>{statusLabels[project.status]}</Badge>
        </div>

        <ProjectMeta project={project} />
        <ProgressBar progress={project.progress} />

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            {project.doneTaskCount}/{project.taskCount} görev tamamlandı
          </div>
          <ProjectActions project={project} clients={clients} showDetail={false} />
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCover({ project }: { project: ProjectListItem }) {
  if (project.coverImageUrl) {
    return (
      <div className="aspect-video overflow-hidden rounded-sm border border-border bg-muted">
        <img
          src={project.coverImageUrl}
          alt={project.cover_image_alt || project.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
      Kapak görseli yok
    </div>
  );
}

function ProjectRow({
  project,
  clients,
}: {
  project: ProjectListItem;
  clients: ProjectClientOption[];
}) {
  return (
    <div className="grid gap-4 px-4 py-4 grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr] items-center">
      <div className="min-w-0">
        <div className="font-medium text-foreground">{project.name}</div>
        <div className="truncate text-sm text-muted-foreground">
          {project.clientName || "Bağımsız side project"}
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{typeLabels[project.type]}</div>
      <div>
        <Badge className={statusClasses[project.status]}>{statusLabels[project.status]}</Badge>
      </div>
      <div>
        <ProgressBar progress={project.progress} compact />
      </div>
      <div className="flex justify-end gap-2">
        <ProjectActions project={project} clients={clients} showDetail />
      </div>
    </div>
  );
}

function ProjectMeta({ project }: { project: ProjectListItem }) {
  return (
    <div className="grid gap-2 text-sm text-muted-foreground">
      <div>{typeLabels[project.type]}</div>
      <div>{project.clientName || "Müşteri bağlantısı yok"}</div>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4" />
        {project.due_date ? formatDate(project.due_date) : "Deadline yok"}
      </div>
      <div>{project.budget_amount ? formatCurrency(project.budget_amount) : "Bütçe yok"}</div>
    </div>
  );
}

function ProjectActions({
  project,
  clients,
  showDetail,
}: {
  project: ProjectListItem;
  clients: ProjectClientOption[];
  showDetail: boolean;
}) {
  return (
    <div
      className="flex gap-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {showDetail ? (
        <Button
          size="icon"
          effect="shine"
          asChild
          variant="secondary"
          title="Detaya git"
          aria-label="Detaya git"
        >
          <PendingLink href={`/projects/${project.id}`} className="flex h-full w-full items-center justify-center" showSpinner>
            <Eye className="h-4 w-4" />
          </PendingLink>
        </Button>
      ) : null}
      <ProjectDialog mode="edit" project={project} clients={clients} iconOnly />
      {project.status !== "completed" ? (
        <form action={completeProjectRecord}>
          <input type="hidden" name="id" value={project.id} />
          <PendingSubmitButton
            size="icon"
            variant="secondary"
            title="Tamamla"
            aria-label="Tamamla"
            idleIcon={<CheckCircle2 className="h-4 w-4" />}
          >
          </PendingSubmitButton>
        </form>
      ) : null}
    </div>
  );
}

function ProjectDialog({
  mode,
  project,
  clients,
  iconOnly = false,
}: {
  mode: "create" | "edit";
  project?: ProjectListItem;
  clients: ProjectClientOption[];
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectType, setProjectType] = useState(project?.type || "client_project");
  const action = mode === "create" ? createProjectRecord : updateProjectRecord;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      await action(formData);
      setOpen(false);
      toast.success(mode === "create" ? "Proje eklendi." : "Proje güncellendi.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Proje kaydedilirken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine"
          variant={mode === "create" ? "default" : "secondary"}
          size={iconOnly ? "icon" : "default"}
          className={iconOnly ? undefined : "min-w-24 gap-2 px-3"}
          title={mode === "create" ? "Proje ekle" : "Düzenle"}
          aria-label={mode === "create" ? "Proje ekle" : "Düzenle"}
        >
          {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {iconOnly ? null : mode === "create" ? "Proje ekle" : "Düzenle"}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-h-[min(680px,calc(100dvh-4rem))] sm:max-w-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {project ? <input type="hidden" name="id" value={project.id} /> : null}
          <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12">
            <DialogTitle>{mode === "create" ? "Yeni proje" : "Projeyi düzenle"}</DialogTitle>
            <DialogDescription>
              Müşteri projelerini ve kişisel side projectleri aynı modelde takip et.
            </DialogDescription>
          </DialogHeader>

          <div className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <ProjectFormFields
              project={project}
              clients={clients}
              projectType={projectType}
              onProjectTypeChange={setProjectType}
            />
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background p-5">
            <Button variant="default" effect="shine" type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
              {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {isSubmitting
                ? "Kaydediliyor"
                : mode === "create"
                  ? "Projeyi ekle"
                  : "Değişiklikleri kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CoverImageInput({ project }: { project?: ProjectListItem }) {
  const inputId = `cover-${project?.id || "new"}`;
  const [previewUrl, setPreviewUrl] = useState(project?.coverImageUrl || "");

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPreviewUrl(project?.coverImageUrl || "");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });
  }

  return (
    <div className="grid gap-3">
      <Label htmlFor={inputId}>Kapak görseli</Label>
      <label
        htmlFor={inputId}
        className="group relative flex aspect-16/7 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-dashed border-border bg-muted/20 transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={project?.cover_image_alt || project?.name || "Proje kapak görseli önizlemesi"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground transition-colors group-hover:text-primary">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-background shadow-sm">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Kapak görseli seç</div>
              <div className="text-xs">PNG, JPG, WebP veya GIF</div>
            </div>
          </div>
        )}

        {previewUrl ? (
          <div className="absolute inset-x-0 bottom-0 bg-background/90 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
            Görseli değiştirmek için tıkla.
          </div>
        ) : null}
      </label>
      <Input
        id={inputId}
        name="cover_image"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
      />
      <div className="grid gap-2">
        <Label htmlFor={`cover-alt-${project?.id || "new"}`}>Görsel alt metni</Label>
        <Input
          id={`cover-alt-${project?.id || "new"}`}
          name="cover_image_alt"
          defaultValue={project?.cover_image_alt || ""}
          placeholder="Görseli kısaca açıkla"
        />
      </div>
    </div>
  );
}

function ProjectFormFields({
  project,
  clients,
  projectType,
  onProjectTypeChange,
}: {
  project?: ProjectListItem;
  clients: ProjectClientOption[];
  projectType: ProjectListItem["type"];
  onProjectTypeChange: (value: ProjectListItem["type"]) => void;
}) {
  return (
    <div className="grid gap-4">
      <CoverImageInput project={project} />

      <div className="grid gap-2">
        <Label htmlFor={`name-${project?.id || "new"}`}>Proje adı</Label>
        <Input
          id={`name-${project?.id || "new"}`}
          name="name"
          defaultValue={project?.name || ""}
          required
          placeholder="Örn. Marka web sitesi"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Tür</Label>
          <Select
            name="type"
            value={projectType}
            onValueChange={(value) => onProjectTypeChange(value as ProjectListItem["type"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tür seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client_project">Müşteri projesi</SelectItem>
              <SelectItem value="side_project">Side project</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Müşteri</Label>
          <Select
            name="client_id"
            defaultValue={project?.client_id || ""}
            disabled={projectType === "side_project"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Müşteri seç" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`description-${project?.id || "new"}`}>Açıklama</Label>
        <Textarea
          id={`description-${project?.id || "new"}`}
          name="description"
          defaultValue={project?.description || ""}
          placeholder="Kapsam, hedef veya teslimat notları..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Durum</Label>
          <Select name="status" defaultValue={project?.status || "planning"}>
            <SelectTrigger>
              <SelectValue placeholder="Durum seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planlama</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="paused">Duraklatıldı</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`start-${project?.id || "new"}`}>Başlangıç</Label>
          <Input id={`start-${project?.id || "new"}`} name="start_date" type="date" defaultValue={project?.start_date || ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`due-${project?.id || "new"}`}>Deadline</Label>
          <Input id={`due-${project?.id || "new"}`} name="due_date" type="date" defaultValue={project?.due_date || ""} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={`budget-${project?.id || "new"}`}>Bütçe / beklenen gelir</Label>
          <Input
            id={`budget-${project?.id || "new"}`}
            name="budget_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={project?.budget_amount ?? ""}
            placeholder="0"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`currency-${project?.id || "new"}`}>Para birimi</Label>
          <Input id={`currency-${project?.id || "new"}`} name="currency" defaultValue={project?.currency || "USD"} maxLength={3} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`progress-${project?.id || "new"}`}>İlerleme (%)</Label>
          <div className="flex items-center gap-3">
            <Input
              id={`progress-${project?.id || "new"}`}
              name="progress"
              type="range"
              min="0"
              max="100"
              defaultValue={project?.progress ?? 0}
              className="flex-1 cursor-pointer accent-primary"
              onChange={(e) => {
                const el = document.getElementById(`progress-val-${project?.id || "new"}`);
                if (el) el.textContent = `%${e.target.value}`;
              }}
            />
            <span id={`progress-val-${project?.id || "new"}`} className="w-10 text-sm font-medium text-right">
              %{project?.progress ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ progress, compact = false }: { progress: number; compact?: boolean }) {
  return (
    <div className="space-y-2">
      {!compact ? (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>İlerleme</span>
          <span>{progress}%</span>
        </div>
      ) : null}
      <div className={compact ? "h-2 rounded-full bg-muted" : "h-2.5 rounded-full bg-muted"}>
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-8 text-center">
      <FolderKanban className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {hasQuery ? "Aramana uygun proje yok" : "Henüz proje eklenmedi"}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasQuery
          ? "Arama metnini sadeleştirerek tekrar deneyebilirsin."
          : "İlk müşteri projen veya side project kaydınla operasyon akışını kurmaya başlayabilirsin."}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function AIProjectRiskDialog({ projectId }: { projectId?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/project-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bilinmeyen bir hata oluştu.");
      }
      setResult(data.text);
    } catch (err) {
      setResult(
        "Hata: " +
          (err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button effect="shine" variant="secondary" className="gap-2">
          <Brain className="h-4 w-4" />
          AI Risk Analizi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            Proje Risk Analizi
          </DialogTitle>
          <DialogDescription>
            Yapay zeka, projelerinizin ilerleme durumunu ve bitiş tarihlerini kontrol ederek riskleri tahmin eder.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!result && !loading && (
            <div className="text-center py-10">
              <Button variant="default" effect="shine" onClick={handleAnalyze} className="gap-2">
                <Brain className="h-4 w-4" />
                Raporu Oluştur
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-indigo-600">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Projeler analiz ediliyor...</p>
            </div>
          )}

          {result && (
            <div className="bg-muted/50 border border-border rounded-lg p-5 text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {result}
            </div>
          )}
        </div>

        {result && (
          <DialogFooter>
            <Button effect="shine" variant="secondary" onClick={() => setOpen(false)}>Kapat</Button>
            <Button effect="shine" variant="default" onClick={handleAnalyze} className="gap-2">
              <Brain className="h-4 w-4" />
              Yeniden Oluştur
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
