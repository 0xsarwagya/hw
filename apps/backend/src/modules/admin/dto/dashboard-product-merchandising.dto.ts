import { ApiProperty } from "@nestjs/swagger";

export class ProductPerformanceDto {
  @ApiProperty({ description: "Product ID", example: "product-123" })
  productId: string;

  @ApiProperty({ description: "Product title", example: "Sample Product" })
  productTitle: string;

  @ApiProperty({ description: "Total revenue", example: 125000.0 })
  revenue: number;

  @ApiProperty({ description: "Units sold", example: 250 })
  unitsSold: number;

  @ApiProperty({ description: "Gross margin", example: 37500.0 })
  grossMargin: number;

  @ApiProperty({ description: "Gross margin percentage", example: 30.0 })
  grossMarginPercentage: number;
}

export class CategoryPerformanceDto {
  @ApiProperty({ description: "Category ID", example: "category-123" })
  categoryId: string;

  @ApiProperty({ description: "Category name", example: "Electronics" })
  categoryName: string;

  @ApiProperty({ description: "Total revenue", example: 500000.0 })
  revenue: number;

  @ApiProperty({ description: "Units sold", example: 1000 })
  unitsSold: number;

  @ApiProperty({ description: "Number of products", example: 50 })
  productCount: number;
}

export class VariantPerformanceDto {
  @ApiProperty({ description: "Variant ID", example: "variant-123" })
  variantId: string;

  @ApiProperty({ description: "Product ID", example: "product-123" })
  productId: string;

  @ApiProperty({
    description: "Variant attributes",
    example: { size: "M", color: "Red" },
  })
  attributes: Record<string, string>;

  @ApiProperty({ description: "Units sold", example: 150 })
  unitsSold: number;

  @ApiProperty({ description: "Revenue", example: 75000.0 })
  revenue: number;
}

export class PriceElasticityDto {
  @ApiProperty({ description: "Product ID", example: "product-123" })
  productId: string;

  @ApiProperty({ description: "Product title", example: "Sample Product" })
  productTitle: string;

  @ApiProperty({ description: "Discount percentage", example: 20.0 })
  discountPercentage: number;

  @ApiProperty({ description: "Sales increase percentage", example: 45.0 })
  salesIncrease: number;

  @ApiProperty({ description: "Revenue impact", example: 15000.0 })
  revenueImpact: number;
}

export class InventoryTurnoverDto {
  @ApiProperty({ description: "Product ID", example: "product-123" })
  productId: string;

  @ApiProperty({ description: "Product title", example: "Sample Product" })
  productTitle: string;

  @ApiProperty({ description: "Turnover rate", example: 4.5 })
  turnoverRate: number;

  @ApiProperty({ description: "Days to sell inventory", example: 81 })
  daysToSell: number;

  @ApiProperty({ description: "Current inventory", example: 100 })
  currentInventory: number;
}

export class ConversionFunnelDto {
  @ApiProperty({ description: "Product views", example: 10000 })
  views: number;

  @ApiProperty({ description: "Add to cart", example: 500 })
  addToCart: number;

  @ApiProperty({ description: "Purchases", example: 250 })
  purchases: number;

  @ApiProperty({ description: "View to cart conversion rate", example: 5.0 })
  viewToCartRate: number;

  @ApiProperty({
    description: "Cart to purchase conversion rate",
    example: 50.0,
  })
  cartToPurchaseRate: number;

  @ApiProperty({ description: "Overall conversion rate", example: 2.5 })
  overallConversionRate: number;
}

export class ProductMerchandisingDashboardResponseDto {
  @ApiProperty({
    type: [ProductPerformanceDto],
    description: "Best-selling products",
  })
  bestSellingProducts: ProductPerformanceDto[];

  @ApiProperty({
    type: [ProductPerformanceDto],
    description: "Worst-selling products",
  })
  worstSellingProducts: ProductPerformanceDto[];

  @ApiProperty({
    type: [CategoryPerformanceDto],
    description: "Category performance",
  })
  categoryPerformance: CategoryPerformanceDto[];

  @ApiProperty({
    type: [VariantPerformanceDto],
    description: "Top performing variants",
  })
  topVariants: VariantPerformanceDto[];

  @ApiProperty({
    type: [PriceElasticityDto],
    description: "Price elasticity analysis",
  })
  priceElasticity: PriceElasticityDto[];

  @ApiProperty({
    type: [InventoryTurnoverDto],
    description: "Inventory turnover analysis",
  })
  inventoryTurnover: InventoryTurnoverDto[];

  @ApiProperty({ type: ConversionFunnelDto })
  conversionFunnel: ConversionFunnelDto;
}
