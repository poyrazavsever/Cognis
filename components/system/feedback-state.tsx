import { Button, Card, CardContent, Skeleton, Typography } from "poyraz-ui/atoms";
import { Alert, AlertDescription, AlertTitle } from "poyraz-ui/molecules";
import { Ban, CircleAlert, Inbox } from "lucide-react";
import type { ReactNode } from "react";

type FeedbackStateProps = {
  action?: ReactNode;
  description: string;
  title: string;
  variant: "empty" | "error" | "forbidden";
};

export function FeedbackState({ action, description, title, variant }: FeedbackStateProps) {
  if (variant === "empty") {
    return (
      <Card variant="soft">
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-muted text-primary-muted-foreground">
            <Inbox className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <Typography component="h2" variant="h4">{title}</Typography>
            <Typography component="p" variant="muted" className="max-w-lg">{description}</Typography>
          </div>
          {action}
        </CardContent>
      </Card>
    );
  }

  const forbidden = variant === "forbidden";
  return (
    <Alert
      role="alert"
      variant={forbidden ? "warning" : "destructive"}
      appearance="soft"
      icon={forbidden ? <Ban aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
    >
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{description}</p>
        {action}
      </AlertDescription>
    </Alert>
  );
}

export function LoadingState({ label = "İçerik yükleniyor" }: { label?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label={label} role="status">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-2/5" />
      <Skeleton className="h-4 w-3/5" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full" />
        ))}
      </div>
    </div>
  );
}

export function RetryAction({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      Yeniden dene
    </Button>
  );
}
