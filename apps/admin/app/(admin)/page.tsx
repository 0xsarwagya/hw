"use client";

import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOverviewDashboard } from "@/hooks/dashboards/use-overview-dashboard";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading, error } = useOverviewDashboard();

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Dashboard Overview"
        description="Welcome to the admin panel. Here's a quick overview of your store."
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
        title="Dashboard Overview"
        description="Welcome to the admin panel. Here's a quick overview of your store."
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
      title="Dashboard Overview"
      description="Welcome to the admin panel. Here's a quick overview of your store."
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
                {formatCurrency(data.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                This month: {formatCurrency(data.monthlyRevenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(data.totalOrders)}
              </div>
              <p className="text-xs text-muted-foreground">
                Today: {data.ordersToday} | This week: {data.ordersThisWeek} |
                This month: {data.ordersThisMonth}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(data.totalCustomers)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.newCustomersThisMonth} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(data.totalProducts)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.activeProducts} active products
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Average Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.averageOrderValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{data.pendingOrders}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipped</span>
                <span className="font-medium">{data.shippedOrders}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivered</span>
                <span className="font-medium">{data.deliveredOrders}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalRefunds}</div>
              <p className="text-xs text-muted-foreground">
                Refund rate: {data.refundRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {data.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(data.totalReviews)} total reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {data.outOfStockProducts > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Out of Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {data.outOfStockProducts} product
                {data.outOfStockProducts !== 1 ? "s" : ""} currently out of
                stock.
                <Link
                  href="/inventory"
                  className="ml-2 text-orange-600 hover:underline inline-flex items-center gap-1"
                >
                  View inventory <ArrowRight className="h-3 w-3" />
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Links to Detailed Dashboards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboards/performance">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Dashboard
                </CardTitle>
                <CardDescription>
                  Revenue, AOV, profit, conversion metrics
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboards/operations">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Operations Dashboard
                </CardTitle>
                <CardDescription>
                  Order fulfillment, RTO, inventory metrics
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboards/customer-support">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Customer & Support
                </CardTitle>
                <CardDescription>
                  Segmentation, retention, support metrics
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboards/product-merchandising">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product & Merchandising
                </CardTitle>
                <CardDescription>
                  Best sellers, category performance, inventory
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </AdminPageLayout>
  );
}
