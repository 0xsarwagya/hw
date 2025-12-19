"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProfilerMetrics } from "@/lib/types/discounts";

interface DiscountProfilerPanelProps {
  metrics: ProfilerMetrics | null;
  isLoading?: boolean;
}

export function DiscountProfilerPanel({
  metrics,
  isLoading = false,
}: DiscountProfilerPanelProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={`discount-profiler-skeleton-card-${String(i)}`}>
            <CardHeader>
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          No profiler metrics available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Ruleset Version
            </CardTitle>
            <CardDescription>Current discount ruleset version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rulesetVersion}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rules Count</CardTitle>
            <CardDescription>Total discount rules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rulesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
            <CardDescription>Ruleset bundle size</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.bundleSizeKB} KB</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Runtime</CardTitle>
            <CardDescription>Average engine runtime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgEngineRuntimeMs.toFixed(2)} ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Redis Latency</CardTitle>
            <CardDescription>Average Redis latency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.redisLatencyMs.toFixed(2)} ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Cache Hit Rate
            </CardTitle>
            <CardDescription>Percentage of cache hits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.cacheHitRate * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Engine Runs
            </CardTitle>
            <CardDescription>Total discount engine executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalEngineRuns.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Rules Applied
            </CardTitle>
            <CardDescription>Total discount rules applied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalRulesApplied.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Last Hot Reload
            </CardTitle>
            <CardDescription>Last ruleset hot reload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {metrics.lastHotReloadAt ? (
                format(new Date(metrics.lastHotReloadAt), "PPP p")
              ) : (
                <Badge variant="secondary">Never</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
