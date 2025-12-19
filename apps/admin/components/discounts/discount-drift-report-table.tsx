"use client";

import { format } from "date-fns";
import { ActivityLogContextViewer } from "@/components/activity-logs/activity-log-context-viewer";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DriftReportEntry } from "@/lib/types/discounts";

interface DiscountDriftReportTableProps {
  entries: DriftReportEntry[];
  isLoading?: boolean;
}

export function DiscountDriftReportTable({
  entries,
  isLoading = false,
}: DiscountDriftReportTableProps) {
  const getSeverityVariant = (
    severity: string,
  ): "default" | "secondary" | "destructive" => {
    switch (severity) {
      case "CRITICAL":
        return "destructive";
      case "WARNING":
        return "secondary";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Cart/Order ID</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, i) => (
              <TableRow key={`discount-drift-skeleton-row-${String(i)}`}>
                <TableCell colSpan={5}>
                  <div className="h-12 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          No drift events found for the selected filters
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Cart/Order ID</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-mono text-xs">
                {format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm:ss")}
              </TableCell>
              <TableCell>{entry.event}</TableCell>
              <TableCell>
                <Badge variant={getSeverityVariant(entry.severity)}>
                  {entry.severity}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {entry.cartId || entry.orderId || entry.checkoutId || "—"}
              </TableCell>
              <TableCell>
                {entry.driftDetails && (
                  <ActivityLogContextViewer metadata={entry.driftDetails} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
