import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  headers?: string[];
  showActions?: boolean;
}

const DEFAULT_ROWS = 5;

/**
 * Reusable table skeleton component for loading states
 * Provides consistent loading skeleton for tables
 */
export function TableSkeleton({
  columns,
  rows = DEFAULT_ROWS,
  headers,
  showActions = false,
}: TableSkeletonProps) {
  const totalColumns = showActions ? columns + 1 : columns;

  return (
    <div className="rounded-md border">
      <Table>
        {headers && (
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
              {showActions && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex} className="h-12 animate-pulse bg-muted" />
              ))}
              {showActions && (
                <TableCell className="h-12 animate-pulse bg-muted" />
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

