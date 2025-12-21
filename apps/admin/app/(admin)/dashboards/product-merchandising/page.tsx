"use client";

import {
  Eye,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
import { useProductMerchandisingDashboard } from "@/hooks/dashboards/use-product-merchandising-dashboard";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function ProductMerchandisingDashboardPage() {
  const { data, isLoading, error } = useProductMerchandisingDashboard();

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Product & Merchandising Dashboard"
        description="Product performance and merchandising insights"
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
        title="Product & Merchandising Dashboard"
        description="Product performance and merchandising insights"
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
      title="Product & Merchandising Dashboard"
      description="Product performance and merchandising insights"
    >
      <div className="space-y-6">
        {/* Best & Worst Selling Products */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Best Selling Products
              </CardTitle>
              <CardDescription>Top 10 products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.bestSellingProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/products/${product.productId}`}
                        className="font-medium hover:underline"
                      >
                        {product.productTitle}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{formatNumber(product.unitsSold)} units</span>
                        <span>{formatCurrency(product.revenue)}</span>
                        <Badge variant="secondary">
                          {product.grossMarginPercentage.toFixed(1)}% margin
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Worst Selling Products
              </CardTitle>
              <CardDescription>Bottom 10 products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.worstSellingProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/products/${product.productId}`}
                        className="font-medium hover:underline"
                      >
                        {product.productTitle}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{formatNumber(product.unitsSold)} units</span>
                        <span>{formatCurrency(product.revenue)}</span>
                        <Badge variant="secondary">
                          {product.grossMarginPercentage.toFixed(1)}% margin
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Revenue and sales by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categoryPerformance.map((category) => (
                <div key={category.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {category.categoryName}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {category.productCount} products •{" "}
                        {formatNumber(category.unitsSold)} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(category.revenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                  <Progress
                    value={
                      data.categoryPerformance[0]?.revenue
                        ? (category.revenue /
                            data.categoryPerformance[0].revenue) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Variants</CardTitle>
            <CardDescription>Best selling product variants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topVariants.slice(0, 10).map((variant) => (
                <div
                  key={variant.variantId}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div>
                    <Link
                      href={`/products/${variant.productId}`}
                      className="font-medium hover:underline"
                    >
                      Variant
                    </Link>
                    <div className="flex gap-2 mt-1">
                      {Object.entries(variant.attributes).map(
                        ([key, value]) => (
                          <Badge key={key} variant="outline">
                            {key}: {value}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(variant.revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(variant.unitsSold)} units
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Elasticity */}
        <Card>
          <CardHeader>
            <CardTitle>Price Elasticity Analysis</CardTitle>
            <CardDescription>Impact of discounts on sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.priceElasticity.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium hover:underline"
                    >
                      {item.productTitle}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {item.discountPercentage}% discount →{" "}
                      {item.salesIncrease.toFixed(1)}% sales increase
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(item.revenueImpact)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revenue Impact
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Turnover */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Turnover</CardTitle>
            <CardDescription>
              Products with slow inventory movement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.inventoryTurnover.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium hover:underline"
                    >
                      {item.productTitle}
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Turnover: {item.turnoverRate.toFixed(2)}</span>
                      <span>Days to sell: {item.daysToSell.toFixed(0)}</span>
                      <span>
                        Inventory: {formatNumber(item.currentInventory)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Product view to purchase conversion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {formatNumber(data.conversionFunnel.views)}
                </p>
                <p className="text-sm text-muted-foreground">Views</p>
              </div>
              <div className="text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {formatNumber(data.conversionFunnel.addToCart)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Add to Cart ({data.conversionFunnel.viewToCartRate.toFixed(1)}
                  %)
                </p>
              </div>
              <div className="text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {formatNumber(data.conversionFunnel.purchases)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Purchases (
                  {data.conversionFunnel.cartToPurchaseRate.toFixed(1)}%)
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">View to Cart</span>
                <span className="text-sm font-medium">
                  {data.conversionFunnel.viewToCartRate.toFixed(2)}%
                </span>
              </div>
              <Progress
                value={data.conversionFunnel.viewToCartRate}
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">Cart to Purchase</span>
                <span className="text-sm font-medium">
                  {data.conversionFunnel.cartToPurchaseRate.toFixed(2)}%
                </span>
              </div>
              <Progress
                value={data.conversionFunnel.cartToPurchaseRate}
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Overall Conversion Rate
                </span>
                <span className="text-lg font-bold">
                  {data.conversionFunnel.overallConversionRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
