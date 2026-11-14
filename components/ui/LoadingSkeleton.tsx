interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-100 ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* header */}
      <div className="flex gap-4 border-b border-neutral-100 px-5 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-neutral-50 px-5 py-3.5 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3 ${c === 0 ? "flex-[2]" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}
