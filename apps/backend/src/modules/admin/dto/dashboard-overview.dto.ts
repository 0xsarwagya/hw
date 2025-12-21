import { ApiProperty } from "@nestjs/swagger";

export class OverviewDashboardResponseDto {
  @ApiProperty({
    description: "Total revenue",
    example: 500000.0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: "Monthly revenue",
    example: 50000.0,
  })
  monthlyRevenue: number;

  @ApiProperty({
    description: "Average order value",
    example: 2500.0,
  })
  averageOrderValue: number;

  @ApiProperty({
    description: "Total orders",
    example: 500,
  })
  totalOrders: number;

  @ApiProperty({
    description: "Orders today",
    example: 10,
  })
  ordersToday: number;

  @ApiProperty({
    description: "Orders this week",
    example: 50,
  })
  ordersThisWeek: number;

  @ApiProperty({
    description: "Orders this month",
    example: 200,
  })
  ordersThisMonth: number;

  @ApiProperty({
    description: "Total customers",
    example: 200,
  })
  totalCustomers: number;

  @ApiProperty({
    description: "New customers this month",
    example: 25,
  })
  newCustomersThisMonth: number;

  @ApiProperty({
    description: "Total products",
    example: 150,
  })
  totalProducts: number;

  @ApiProperty({
    description: "Active products",
    example: 120,
  })
  activeProducts: number;

  @ApiProperty({
    description: "Pending orders count",
    example: 25,
  })
  pendingOrders: number;

  @ApiProperty({
    description: "Shipped orders count",
    example: 30,
  })
  shippedOrders: number;

  @ApiProperty({
    description: "Delivered orders count",
    example: 400,
  })
  deliveredOrders: number;

  @ApiProperty({
    description: "Out of stock products count",
    example: 5,
  })
  outOfStockProducts: number;

  @ApiProperty({
    description: "Total refunds count",
    example: 10,
  })
  totalRefunds: number;

  @ApiProperty({
    description: "Refund rate percentage",
    example: 2.0,
  })
  refundRate: number;

  @ApiProperty({
    description: "Average rating from reviews",
    example: 4.5,
  })
  averageRating: number;

  @ApiProperty({
    description: "Total reviews count",
    example: 150,
  })
  totalReviews: number;
}
