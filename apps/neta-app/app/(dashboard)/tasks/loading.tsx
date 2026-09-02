import { Card, CardContent, Skeleton } from "poyraz-ui/atoms";

export default function TasksLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="mt-1 h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, colIdx) => (
          <div key={colIdx} className="w-[340px] flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between px-1 mb-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {Array.from({ length: colIdx === 0 ? 4 : colIdx === 1 ? 3 : 2 }).map((_, cardIdx) => (
              <Card key={cardIdx}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <div className="flex items-center gap-2 pt-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
