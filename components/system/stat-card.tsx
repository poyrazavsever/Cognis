import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "poyraz-ui/atoms";

import { cn } from "@/lib/utils";

export type StatCardTone =
  | "primary"
  | "green"
  | "blue"
  | "amber"
  | "red"
  | "rose";

const iconToneClasses: Record<StatCardTone, string> = {
  primary: "bg-primary/10 text-primary",
  green: "bg-success text-success-icon",
  blue: "bg-info text-info-icon",
  amber: "bg-warning text-warning-icon",
  red: "bg-destructive-muted text-destructive-muted-foreground",
  rose: "bg-destructive-muted text-destructive-muted-foreground",
};

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  description?: string;
  featured?: boolean;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  description,
  featured = false,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "h-full",
        featured && "border-primary/30 bg-primary/[0.025] shadow-sm",
        className,
      )}
    >
      <CardContent className="flex h-full items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-foreground">
            {value}
          </p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm",
            iconToneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
