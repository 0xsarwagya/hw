import { ApiProperty } from "@nestjs/swagger";

export class RevenueMetricsDto {
  @ApiProperty({ description: "Total revenue", example: 1500000.5 })
  totalRevenue: number;

  @ApiProperty({ description: "Average order value", example: 2500.75 })
  averageOrderValue: number;

  @ApiProperty({ description: "Total profit", example: 450000.25 })
  totalProfit: number;

  @ApiProperty({ description: "Gross margin percentage", example: 30.5 })
  grossMargin: number;

  @ApiProperty({ description: "Net margin percentage", example: 25.2 })
  netMargin: number;
}

export class OrderVolumeDto {
  @ApiProperty({ description: "Total orders", example: 600 })
  totalOrders: number;

  @ApiProperty({ description: "Orders today", example: 15 })
  ordersToday: number;

  @ApiProperty({ description: "Orders this week", example: 105 })
  ordersThisWeek: number;

  @ApiProperty({ description: "Orders this month", example: 450 })
  ordersThisMonth: number;
}

export class ConversionMetricsDto {
  @ApiProperty({ description: "Conversion rate percentage", example: 2.5 })
  conversionRate: number;

  @ApiProperty({ description: "Total visitors", example: 24000 })
  totalVisitors: number;

  @ApiProperty({ description: "Total sessions", example: 28000 })
  totalSessions: number;
}

export class MarketingMetricsDto {
  @ApiProperty({ description: "Customer acquisition cost", example: 500.0 })
  cac: number;

  @ApiProperty({ description: "Return on ad spend", example: 4.5 })
  roas: number;

  @ApiProperty({ description: "Total marketing spend", example: 120000.0 })
  marketingSpend: number;
}

export class RefundMetricsDto {
  @ApiProperty({ description: "Refund rate percentage", example: 3.2 })
  refundRate: number;

  @ApiProperty({ description: "Total refunds", example: 19 })
  totalRefunds: number;

  @ApiProperty({ description: "Total refund amount", example: 47500.0 })
  totalRefundAmount: number;

  @ApiProperty({ description: "Cancellation rate percentage", example: 1.5 })
  cancellationRate: number;
}

export class TrendDataPointDto {
  @ApiProperty({ description: "Date", example: "2025-12-21" })
  date: string;

  @ApiProperty({ description: "Value", example: 50000.0 })
  value: number;
}

export class TrafficSourceDto {
  @ApiProperty({ description: "Traffic source name", example: "Organic" })
  source: string;

  @ApiProperty({ description: "Number of visitors", example: 12000 })
  visitors: number;

  @ApiProperty({ description: "Revenue from source", example: 600000.0 })
  revenue: number;

  @ApiProperty({ description: "Conversion rate", example: 2.8 })
  conversionRate: number;
}

export class PerformanceDashboardResponseDto {
  @ApiProperty({ type: RevenueMetricsDto })
  revenue: RevenueMetricsDto;

  @ApiProperty({ type: OrderVolumeDto })
  orderVolume: OrderVolumeDto;

  @ApiProperty({ type: ConversionMetricsDto })
  conversion: ConversionMetricsDto;

  @ApiProperty({ type: MarketingMetricsDto })
  marketing: MarketingMetricsDto;

  @ApiProperty({ type: RefundMetricsDto })
  refunds: RefundMetricsDto;

  @ApiProperty({
    type: [TrendDataPointDto],
    description: "Daily revenue trends",
  })
  dailyTrends: TrendDataPointDto[];

  @ApiProperty({
    type: [TrendDataPointDto],
    description: "Weekly revenue trends",
  })
  weeklyTrends: TrendDataPointDto[];

  @ApiProperty({
    type: [TrendDataPointDto],
    description: "Monthly revenue trends",
  })
  monthlyTrends: TrendDataPointDto[];

  @ApiProperty({
    type: [TrafficSourceDto],
    description: "Traffic sources breakdown",
  })
  trafficSources: TrafficSourceDto[];
}
