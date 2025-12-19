import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SKELETON_ROW_COUNT = 5;

/**
 * Loading skeleton for customers table
 */
export function CustomersTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>GSTIN</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <TableRow key={`customer-skeleton-row-${String(index)}`}>
              <TableCell className="h-12 animate-pulse bg-muted" />
              <TableCell className="h-12 animate-pulse bg-muted" />
              <TableCell className="h-12 animate-pulse bg-muted" />
              <TableCell className="h-12 animate-pulse bg-muted" />
              <TableCell className="h-12 animate-pulse bg-muted" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
