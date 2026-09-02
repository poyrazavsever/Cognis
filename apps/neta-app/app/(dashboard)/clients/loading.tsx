import { Card, CardContent, Skeleton } from "poyraz-ui/atoms";

export default function ClientsLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="mt-1 h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-72" />
      </div>

      {/* Pipeline Kanban Columns */}
      <div className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: 5 }).map((_, colIdx) => (
          <div key={colIdx} className="w-[340px] flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            {Array.from({ length: colIdx < 2 ? 3 : colIdx < 4 ? 2 : 1 }).map((_, cardIdx) => (
              <Card key={cardIdx}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-6" />
                  </div>
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
