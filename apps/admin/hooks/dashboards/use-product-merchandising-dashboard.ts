"use client";

import { endpoints } from "@/lib/endpoints";
import { useApiQuery } from "../use-api-query";

export interface ProductPerformance {
  productId: string;
  productTitle: string;
  revenue: number;
  unitsSold: number;
  grossMargin: number;
  grossMarginPercentage: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  revenue: number;
  unitsSold: number;
  productCount: number;
}

export interface VariantPerformance {
  variantId: string;
  productId: string;
  attributes: Record<string, string>;
  unitsSold: number;
  revenue: number;
}

export interface PriceElasticity {
  productId: string;
  productTitle: string;
  discountPercentage: number;
  salesIncrease: number;
  revenueImpact: number;
}

export interface InventoryTurnover {
  productId: string;
  productTitle: string;
  turnoverRate: number;
  daysToSell: number;
  currentInventory: number;
}

export interface ConversionFunnel {
  views: number;
  addToCart: number;
  purchases: number;
  viewToCartRate: number;
  cartToPurchaseRate: number;
  overallConversionRate: number;
}

export interface ProductMerchandisingDashboard {
  bestSellingProducts: ProductPerformance[];
  worstSellingProducts: ProductPerformance[];
  categoryPerformance: CategoryPerformance[];
  topVariants: VariantPerformance[];
  priceElasticity: PriceElasticity[];
  inventoryTurnover: InventoryTurnover[];
  conversionFunnel: ConversionFunnel;
}

export function useProductMerchandisingDashboard() {
  return useApiQuery<ProductMerchandisingDashboard>(
    endpoints.dashboards.productMerchandising,
    {
      refetchInterval: 60000, // Refresh every minute
    },
  );
}
