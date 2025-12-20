"use client";

import { AlertCircle, Clock, Database, FileText } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * System logs and monitoring page
 *
 * Note: Backend needs to implement log aggregation endpoints.
 * Currently shows structure ready for when backend APIs are available.
 */
export function SystemLogsPageClient() {
  // TODO: Replace with actual log data from API
  const errorLogs: Array<{
    id: string;
    level: "error" | "warn" | "info";
    message: string;
    timestamp: Date | string;
    endpoint?: string;
    userId?: string;
  }> = [];

  const slowQueries: Array<{
    id: string;
    query: string;
    duration: number;
    timestamp: Date | string;
  }> = [];

  return (
    <AdminPageLayout
      title="System Logs"
      description="View system logs, errors, and performance metrics"
    >
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="redis">Redis Health</TabsTrigger>
          <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Recent Errors</CardTitle>
              </div>
              <CardDescription>
                Recent backend errors and exceptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorLogs.length === 0 ? (
                <EmptyState
                  type="default"
                  title="No errors"
                  description="No errors logged in the recent period."
                  icon={<AlertCircle className="h-12 w-12" />}
                />
              ) : (
                <div className="space-y-2">
                  {errorLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                log.level === "error"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {log.level}
                            </Badge>
                            {log.endpoint && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {log.endpoint}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <CardTitle>Slow Queries & Endpoints</CardTitle>
              </div>
              <CardDescription>
                Endpoints and queries taking longer than expected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slowQueries.length === 0 ? (
                <EmptyState
                  type="default"
                  title="No slow queries"
                  description="All queries are performing within acceptable limits."
                  icon={<Clock className="h-12 w-12" />}
                />
              ) : (
                <div className="space-y-2">
                  {slowQueries.map((query) => (
                    <div
                      key={query.id}
                      className="rounded-lg border p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-mono mb-1">
                            {query.query}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {query.duration}ms
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(query.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redis" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Redis Health</CardTitle>
              </div>
              <CardDescription>
                Redis connection status and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Redis health monitoring requires
                  backend API implementation. This will show Redis connection
                  status, memory usage, and key statistics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Background Jobs</CardTitle>
              </div>
              <CardDescription>
                History of background job executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Background job history requires backend
                  API implementation. This will show shipping jobs, media
                  consistency jobs, and other background tasks.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
