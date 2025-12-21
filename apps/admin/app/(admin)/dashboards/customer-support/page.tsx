"use client";

import { Repeat, Star, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
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
import { useCustomerSupportDashboard } from "@/hooks/dashboards/use-customer-support-dashboard";
import { formatCurrency } from "@/lib/utils";

export default function CustomerSupportDashboardPage() {
  const { data, isLoading, error } = useCustomerSupportDashboard();

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Customer & Support Dashboard"
        description="Customer experience and sentiment metrics"
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
        title="Customer & Support Dashboard"
        description="Customer experience and sentiment metrics"
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
      title="Customer & Support Dashboard"
      description="Customer experience and sentiment metrics"
    >
      <div className="space-y-6">
        {/* Customer Segmentation */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.segmentation.newCustomers}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.segmentation.newCustomerPercentage.toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Returning Customers
              </CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.segmentation.returningCustomers}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.segmentation.returningCustomerPercentage.toFixed(1)}% of
                total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Repeat Purchase Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.retention.repeatPurchaseRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data.retention.customersWithMultipleOrders} customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average CLV</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.retention.averageClv)}
              </div>
              <CardDescription>Customer Lifetime Value</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Support Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Support Metrics</CardTitle>
            <CardDescription>Ticket volume and response times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">
                  {data.support.totalTickets}
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">
                    {data.support.openTickets} Open
                  </Badge>
                  <Badge variant="outline">
                    {data.support.resolvedTickets} Resolved
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg Response Time
                </p>
                <p className="text-2xl font-bold">
                  {data.support.averageResponseTime.toFixed(1)}h
                </p>
                <p className="text-xs text-muted-foreground">
                  SLA: {data.support.firstResponseSla.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg Resolution Time
                </p>
                <p className="text-2xl font-bold">
                  {data.support.averageResolutionTime.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Top Return Reasons</CardTitle>
            <CardDescription>Most common reasons for returns</CardDescription>
          </CardHeader>
          <CardContent>
            {data.returnReasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No return data available
              </p>
            ) : (
              <div className="space-y-4">
                {data.returnReasons.map((reason) => (
                  <div key={reason.reason} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{reason.reason}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {reason.count} returns
                        </span>
                        <Badge variant="secondary">
                          {reason.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={reason.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complaint Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Product Complaint Trends</CardTitle>
            <CardDescription>
              Products with highest complaint rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.complaintTrends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No complaint data available
              </p>
            ) : (
              <div className="space-y-2">
                {data.complaintTrends.map((trend) => (
                  <div
                    key={trend.productId}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <Link
                        href={`/products/${trend.productId}`}
                        className="font-medium hover:underline"
                      >
                        {trend.productTitle}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {trend.complaintCount} complaints
                      </p>
                    </div>
                    <Badge
                      variant={
                        trend.complaintRate > 5 ? "destructive" : "secondary"
                      }
                    >
                      {trend.complaintRate.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Sentiment */}
        <Card>
          <CardHeader>
            <CardTitle>Review Sentiment</CardTitle>
            <CardDescription>Customer review analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <p className="text-2xl font-bold">
                    {data.reviewSentiment.averageRating.toFixed(1)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">
                  {data.reviewSentiment.totalReviews}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Net Promoter Score
                </p>
                <p className="text-2xl font-bold">
                  {data.reviewSentiment.nps.toFixed(0)}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Positive (4-5 stars)
                </p>
                <p className="text-xl font-bold text-green-600">
                  {data.reviewSentiment.positiveReviews}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Neutral (3 stars)
                </p>
                <p className="text-xl font-bold text-yellow-600">
                  {data.reviewSentiment.neutralReviews}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Negative (1-2 stars)
                </p>
                <p className="text-xl font-bold text-red-600">
                  {data.reviewSentiment.negativeReviews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
