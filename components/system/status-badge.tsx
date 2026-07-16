import { Badge } from "poyraz-ui/atoms";
import type { ComponentProps } from "react";

const statusPresentation = {
  accepted: { label: "Kabul edildi", variant: "success" },
  active: { label: "Aktif", variant: "success" },
  archived: { label: "Arşivlendi", variant: "outline" },
  cancelled: { label: "İptal edildi", variant: "outline" },
  completed: { label: "Tamamlandı", variant: "success" },
  done: { label: "Tamamlandı", variant: "success" },
  draft: { label: "Taslak", variant: "secondary" },
  expired: { label: "Süresi doldu", variant: "destructive" },
  in_progress: { label: "Devam ediyor", variant: "info" },
  overdue: { label: "Gecikmiş", variant: "destructive" },
  paid: { label: "Ödendi", variant: "success" },
  paused: { label: "Duraklatıldı", variant: "warning" },
  pending: { label: "Bekliyor", variant: "warning" },
  planned: { label: "Planlandı", variant: "secondary" },
  planning: { label: "Planlanıyor", variant: "secondary" },
  rejected: { label: "Reddedildi", variant: "destructive" },
  revoked: { label: "İptal edildi", variant: "destructive" },
  sent: { label: "Gönderildi", variant: "info" },
  todo: { label: "Yapılacak", variant: "secondary" },
} as const satisfies Record<string, { label: string; variant: NonNullable<ComponentProps<typeof Badge>["variant"]> }>;

export type NetaStatus = keyof typeof statusPresentation;

type StatusBadgeProps = Omit<ComponentProps<typeof Badge>, "children" | "variant"> & {
  status: NetaStatus;
};

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const presentation = statusPresentation[status];
  return (
    <Badge variant={presentation.variant} {...props}>
      {presentation.label}
    </Badge>
  );
}

export { statusPresentation };
