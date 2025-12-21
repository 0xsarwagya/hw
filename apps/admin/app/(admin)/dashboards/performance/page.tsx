"use client";

import { DollarSign, ShoppingCart, Target, TrendingUp } from "lucide-react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePerformanceDashboard } from "@/hooks/dashboards/use-performance-dashboard";
import { formatCurrency } from "@/lib/utils";

export default function PerformanceDashboardPage() {
  const { data, isLoading, error } = usePerformanceDashboard();

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Performance Dashboard"
        description="Business and executive metrics - Are we winning or losing?"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </AdminPageLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminPageLayout
        title="Performance Dashboard"
        description="Business and executive metrics - Are we winning or losing?"
      >
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load dashboard data</CardDescription>
          </CardHeader>
        </Card>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Performance Dashboard"
      description="Business and executive metrics - Are we winning or losing?"
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.revenue.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                AOV: {formatCurrency(data.revenue.averageOrderValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Profit
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.revenue.totalProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gross Margin: {data.revenue.grossMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Order Volume
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.orderVolume.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Today: {data.orderVolume.ordersToday} | This Week:{" "}
                {data.orderVolume.ordersThisWeek}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.conversion.conversionRate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data.conversion.totalVisitors.toLocaleString()} visitors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Marketing & Refunds */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">CAC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.marketing.cac)}
              </div>
              <CardDescription>Customer Acquisition Cost</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.marketing.roas.toFixed(2)}x
              </div>
              <CardDescription>Return on Ad Spend</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.refunds.refundRate.toFixed(2)}%
              </div>
              <CardDescription>
                {data.refunds.totalRefunds} refunds (
                {formatCurrency(data.refunds.totalRefundAmount)})
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Cancellation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.refunds.cancellationRate.toFixed(2)}%
              </div>
              <CardDescription>Order cancellation percentage</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trends */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trends</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.dailyTrends.slice(-7).map((trend) => (
                  <div
                    key={trend.date}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {trend.date}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(trend.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue Trends</CardTitle>
              <CardDescription>Last 12 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.weeklyTrends.slice(-4).map((trend) => (
                  <div
                    key={trend.date}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      Week of {trend.date}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(trend.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trends</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.monthlyTrends.slice(-6).map((trend) => (
                  <div
                    key={trend.date}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {trend.date}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(trend.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>
              Revenue breakdown by traffic source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.trafficSources.map((source) => (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{source.source}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {source.visitors.toLocaleString()} visitors
                      </span>
                      <span className="font-medium">
                        {formatCurrency(source.revenue)}
                      </span>
                      <Badge variant="secondary">
                        {source.conversionRate.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={(source.revenue / data.revenue.totalRevenue) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
