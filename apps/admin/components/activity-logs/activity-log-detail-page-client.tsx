"use client";

import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminActivityLog } from "@/hooks/activity-logs/use-admin-activity-log";
import { ActivityLogContextViewer } from "./activity-log-context-viewer";
import { getActionSeverity, getResourceColor } from "./activity-log-row";

export function ActivityLogDetailPageClient() {
  const params = useParams();
  const logId = params.id as string;

  const { data: log, isLoading, error } = useAdminActivityLog(logId);

  if (isLoading) {
    return (
      <AdminPageLayout title="Activity Log" description="Loading...">
        <div className="space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminPageLayout>
    );
  }

  if (error || !log) {
    return (
      <AdminPageLayout title="Activity Log" description="Error">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            {error?.message || "Activity log not found"}
          </p>
          <Button asChild variant="outline">
            <Link href="/activity-logs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Activity Logs
            </Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Activity Log Details"
      description="View detailed information about this activity log"
      actions={
        <Button variant="outline" asChild>
          <Link href="/activity-logs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Information</CardTitle>
            <CardDescription>Basic details about this activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Timestamp
                </span>
                <p className="mt-1">
                  {format(new Date(log.createdAt), "PPP 'at' p")}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Admin
                </span>
                <p className="mt-1">{log.adminEmail || "Unknown"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Action
                </span>
                <div className="mt-1">
                  <Badge variant={getActionSeverity(log.action)}>
                    {log.action}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Resource
                </span>
                <div className="mt-1">
                  {log.resource ? (
                    <Badge variant={getResourceColor(log.resource)}>
                      {log.resource}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Entity ID
                </span>
                <p className="mt-1 font-mono text-sm">{log.entityId || "—"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Admin ID
                </span>
                <p className="mt-1 font-mono text-sm">{log.adminId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
            <CardDescription>IP address and user agent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                IP Address
              </span>
              <p className="mt-1 font-mono text-sm">{log.ipAddress || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                User Agent
              </span>
              <p className="mt-1 text-sm break-all">{log.userAgent || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {log.metadata && (
          <Card>
            <CardHeader>
              <CardTitle>Context</CardTitle>
              <CardDescription>Additional metadata and context</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityLogContextViewer metadata={log.metadata} />
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageLayout>
  );
}
