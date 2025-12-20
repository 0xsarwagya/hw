import { Metadata } from "next";
import { Suspense } from "react";
import { AuditLogsPageClient } from "@/components/audit-logs/audit-logs-page-client";
import { TableSkeleton } from "@/components/common/table-skeleton";

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "View audit logs and activity history",
};

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all administrative actions and changes
        </p>
      </div>

      <Suspense fallback={<TableSkeleton columns={6} />}>
        <AuditLogsPageClient />
      </Suspense>
    </div>
  );
}
