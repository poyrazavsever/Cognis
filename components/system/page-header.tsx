import { Typography } from "poyraz-ui/atoms";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  primaryAction,
  secondaryActions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? (
          <Typography component="p" variant="caption" className="font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </Typography>
        ) : null}
        <Typography component="h1" variant="h1" balance>
          {title}
        </Typography>
        {description ? (
          <Typography component="p" variant="muted" className="max-w-3xl">
            {description}
          </Typography>
        ) : null}
      </div>

      {primaryAction || secondaryActions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction}
        </div>
      ) : null}
    </header>
  );
}
