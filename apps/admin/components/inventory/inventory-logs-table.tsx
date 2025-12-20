"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryLogEntry } from "@/lib/types/inventory";

interface InventoryLogsTableProps {
  logs: InventoryLogEntry[];
}

/**
 * Table component for displaying inventory adjustment logs
 */
export function InventoryLogsTable({ logs }: InventoryLogsTableProps) {
  const formatDelta = (delta: number) => {
    if (delta > 0) {
      return `+${delta}`;
    }
    return `${delta}`;
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) {
      return "text-green-600";
    }
    if (delta < 0) {
      return "text-red-600";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead className="w-[150px]">Admin</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[100px]">Delta</TableHead>
            <TableHead className="w-[120px]">Reason</TableHead>
            <TableHead className="w-[150px]">Metadata</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                No logs found
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {log.createdAt
                    ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm")
                    : "-"}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {log.actorAdminId.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {log.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`font-medium ${getDeltaColor(log.delta)}`}
                >
                  {formatDelta(log.delta)}
                </TableCell>
                <TableCell className="text-sm capitalize">
                  {log.reason}
                </TableCell>
                <TableCell className="text-sm">
                  {log.metadata?.orderId && (
                    <div className="text-xs text-muted-foreground">
                      Order: {log.metadata.orderId.slice(0, 8)}...
                    </div>
                  )}
                  {log.metadata?.refundId && (
                    <div className="text-xs text-muted-foreground">
                      Refund: {log.metadata.refundId.slice(0, 8)}...
                    </div>
                  )}
                  {!log.metadata?.orderId && !log.metadata?.refundId && "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.metadata?.note || "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
