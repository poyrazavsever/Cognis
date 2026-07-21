import { Card, CardContent } from "poyraz-ui/atoms";

export default function SettingsLoading() {
  return (
    <Card aria-busy="true">
      <CardContent className="space-y-4 p-6 sm:p-8">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  );
}
