import { Badge } from "poyraz-ui/atoms";
import type { ComponentProps } from "react";

const statusPresentation = {
  accepted: { labelKey: "status.common.accepted", variant: "success" },
  active: { labelKey: "status.common.active", variant: "success" },
  archived: { labelKey: "status.common.archived", variant: "outline" },
  cancelled: { labelKey: "status.common.cancelled", variant: "outline" },
  completed: { labelKey: "status.common.completed", variant: "success" },
  done: { labelKey: "status.common.done", variant: "success" },
  draft: { labelKey: "status.common.draft", variant: "secondary" },
  expired: { labelKey: "status.common.expired", variant: "destructive" },
  in_progress: { labelKey: "status.common.inProgress", variant: "info" },
  overdue: { labelKey: "status.common.overdue", variant: "destructive" },
  paid: { labelKey: "status.common.paid", variant: "success" },
  paused: { labelKey: "status.common.paused", variant: "warning" },
  pending: { labelKey: "status.common.pending", variant: "warning" },
  planned: { labelKey: "status.common.planned", variant: "secondary" },
  planning: { labelKey: "status.common.planning", variant: "secondary" },
  rejected: { labelKey: "status.common.rejected", variant: "destructive" },
  revoked: { labelKey: "status.common.revoked", variant: "destructive" },
  sent: { labelKey: "status.common.sent", variant: "info" },
  todo: { labelKey: "status.common.todo", variant: "secondary" },
} as const satisfies Record<string, { labelKey: string; variant: NonNullable<ComponentProps<typeof Badge>["variant"]> }>;

export type NetaStatus = keyof typeof statusPresentation;

type StatusBadgeProps = Omit<ComponentProps<typeof Badge>, "children" | "variant"> & {
  label: string;
  status: NetaStatus;
};

export function StatusBadge({ label, status, ...props }: StatusBadgeProps) {
  const presentation = statusPresentation[status];
  return (
    <Badge variant={presentation.variant} {...props}>
      {label}
    </Badge>
  );
}

export { statusPresentation };
