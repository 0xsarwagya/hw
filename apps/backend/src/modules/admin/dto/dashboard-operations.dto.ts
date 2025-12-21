import { ApiProperty } from "@nestjs/swagger";

export class OrderStatusCountDto {
  @ApiProperty({ description: "Pending orders", example: 25 })
  pending: number;

  @ApiProperty({ description: "Packed orders", example: 15 })
  packed: number;

  @ApiProperty({ description: "Shipped orders", example: 45 })
  shipped: number;

  @ApiProperty({ description: "Delivered orders", example: 320 })
  delivered: number;

  @ApiProperty({ description: "Cancelled orders", example: 8 })
  cancelled: number;
}

export class DelayedOrderDto {
  @ApiProperty({ description: "Order ID", example: "order-123" })
  orderId: string;

  @ApiProperty({ description: "Order number", example: "ORD-2025-001" })
  orderNumber: string;

  @ApiProperty({ description: "Days delayed", example: 3 })
  daysDelayed: number;

  @ApiProperty({ description: "Current status", example: "shipped" })
  status: string;

  @ApiProperty({ description: "Expected delivery date", example: "2025-12-18" })
  expectedDeliveryDate: string;
}

export class RtoMetricsDto {
  @ApiProperty({ description: "RTO rate percentage", example: 5.2 })
  rtoRate: number;

  @ApiProperty({ description: "Total RTO orders", example: 31 })
  totalRtoOrders: number;

  @ApiProperty({ description: "RTO orders this month", example: 12 })
  rtoThisMonth: number;
}

export class InventoryAgingDto {
  @ApiProperty({
    description: "Products with 0-30 days inventory",
    example: 150,
  })
  days0to30: number;

  @ApiProperty({
    description: "Products with 31-60 days inventory",
    example: 85,
  })
  days31to60: number;

  @ApiProperty({
    description: "Products with 61-90 days inventory",
    example: 45,
  })
  days61to90: number;

  @ApiProperty({ description: "Products with 90+ days inventory", example: 20 })
  days90Plus: number;
}

export class OutOfStockAlertDto {
  @ApiProperty({ description: "Product ID", example: "product-123" })
  productId: string;

  @ApiProperty({ description: "Product title", example: "Sample Product" })
  productTitle: string;

  @ApiProperty({ description: "Current inventory", example: 0 })
  inventory: number;

  @ApiProperty({ description: "Days out of stock", example: 5 })
  daysOutOfStock: number;
}

export class ShippingMetricsDto {
  @ApiProperty({ description: "Average shipping time in days", example: 3.5 })
  averageShippingTime: number;

  @ApiProperty({
    type: "object",
    additionalProperties: { type: "number" },
    description: "Average shipping time by courier",
    example: { Shiprocket: 3.2, NimbusPost: 3.8 },
  })
  averageTimeByCourier: Record<string, number>;

  @ApiProperty({ description: "SLA breach count", example: 8 })
  slaBreaches: number;

  @ApiProperty({ description: "SLA breach percentage", example: 2.5 })
  slaBreachRate: number;
}

export class OperationsDashboardResponseDto {
  @ApiProperty({ type: OrderStatusCountDto })
  orderStatusCounts: OrderStatusCountDto;

  @ApiProperty({
    type: [DelayedOrderDto],
    description: "Delayed orders",
  })
  delayedOrders: DelayedOrderDto[];

  @ApiProperty({ type: RtoMetricsDto })
  rto: RtoMetricsDto;

  @ApiProperty({ type: InventoryAgingDto })
  inventoryAging: InventoryAgingDto;

  @ApiProperty({
    type: [OutOfStockAlertDto],
    description: "Out of stock alerts",
  })
  outOfStockAlerts: OutOfStockAlertDto[];

  @ApiProperty({ type: ShippingMetricsDto })
  shipping: ShippingMetricsDto;
}
