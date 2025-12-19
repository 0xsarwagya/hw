import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={`header-${String(i)}`} className="h-10 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={`row-${String(rowIndex)}`} className="flex gap-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={`cell-${String(rowIndex)}-${String(colIndex)}`}
              className="h-12 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
