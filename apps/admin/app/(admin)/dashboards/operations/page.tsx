"use client";

import { AlertTriangle, Clock, Package, Truck } from "lucide-react";
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
import { useOperationsDashboard } from "@/hooks/dashboards/use-operations-dashboard";

export default function OperationsDashboardPage() {
  const { data, isLoading, error } = useOperationsDashboard();

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Operations Dashboard"
        description="Fulfillment and logistics metrics - Are we delivering properly?"
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
        title="Operations Dashboard"
        description="Fulfillment and logistics metrics - Are we delivering properly?"
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

  const totalOrders =
    data.orderStatusCounts.pending +
    data.orderStatusCounts.packed +
    data.orderStatusCounts.shipped +
    data.orderStatusCounts.delivered +
    data.orderStatusCounts.cancelled;

  return (
    <AdminPageLayout
      title="Operations Dashboard"
      description="Fulfillment and logistics metrics - Are we delivering properly?"
    >
      <div className="space-y-6">
        {/* Order Status Overview */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.orderStatusCounts.pending}
              </div>
              <Progress
                value={(data.orderStatusCounts.pending / totalOrders) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Packed</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.orderStatusCounts.packed}
              </div>
              <Progress
                value={(data.orderStatusCounts.packed / totalOrders) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipped</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.orderStatusCounts.shipped}
              </div>
              <Progress
                value={(data.orderStatusCounts.shipped / totalOrders) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.orderStatusCounts.delivered}
              </div>
              <Progress
                value={(data.orderStatusCounts.delivered / totalOrders) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.orderStatusCounts.cancelled}
              </div>
              <Progress
                value={(data.orderStatusCounts.cancelled / totalOrders) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Delayed Orders & RTO */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Delayed Orders</CardTitle>
              <CardDescription>
                Orders shipped but not delivered after 5 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.delayedOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No delayed orders
                </p>
              ) : (
                <div className="space-y-2">
                  {data.delayedOrders.slice(0, 10).map((order) => (
                    <div
                      key={order.orderId}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div>
                        <Link
                          href={`/orders/${order.orderId}`}
                          className="font-medium hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {order.daysDelayed} days delayed
                        </p>
                      </div>
                      <Badge variant="destructive">{order.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RTO Metrics</CardTitle>
              <CardDescription>Return to Origin statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">RTO Rate</span>
                  <span className="text-2xl font-bold">
                    {data.rto.rtoRate.toFixed(2)}%
                  </span>
                </div>
                <Progress value={data.rto.rtoRate} className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total RTO Orders
                  </p>
                  <p className="text-xl font-bold">{data.rto.totalRtoOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold">{data.rto.rtoThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Aging */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Aging</CardTitle>
            <CardDescription>
              Products grouped by days in inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">0-30 Days</p>
                <p className="text-2xl font-bold">
                  {data.inventoryAging.days0to30}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">31-60 Days</p>
                <p className="text-2xl font-bold">
                  {data.inventoryAging.days31to60}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">61-90 Days</p>
                <p className="text-2xl font-bold">
                  {data.inventoryAging.days61to90}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">90+ Days</p>
                <p className="text-2xl font-bold">
                  {data.inventoryAging.days90Plus}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Out of Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Out of Stock Alerts</CardTitle>
            <CardDescription>Products currently out of stock</CardDescription>
          </CardHeader>
          <CardContent>
            {data.outOfStockAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No out of stock products
              </p>
            ) : (
              <div className="space-y-2">
                {data.outOfStockAlerts.map((alert) => (
                  <div
                    key={alert.productId}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <Link
                        href={`/products/${alert.productId}`}
                        className="font-medium hover:underline"
                      >
                        {alert.productTitle}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Out of stock for {alert.daysOutOfStock} days
                      </p>
                    </div>
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Metrics</CardTitle>
            <CardDescription>
              Average shipping times and SLA performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Average Shipping Time
                </p>
                <p className="text-2xl font-bold">
                  {data.shipping.averageShippingTime.toFixed(1)} days
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SLA Breach Rate</p>
                <p className="text-2xl font-bold">
                  {data.shipping.slaBreachRate.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.shipping.slaBreaches} breaches
                </p>
              </div>
            </div>
            {Object.keys(data.shipping.averageTimeByCourier).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Average Time by Courier
                </p>
                <div className="space-y-2">
                  {Object.entries(data.shipping.averageTimeByCourier).map(
                    ([courier, time]) => (
                      <div
                        key={courier}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{courier}</span>
                        <span className="font-medium">
                          {time.toFixed(1)} days
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
