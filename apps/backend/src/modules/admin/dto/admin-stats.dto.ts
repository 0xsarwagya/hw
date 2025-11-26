import { ApiProperty } from "@nestjs/swagger";

export class AdminStatsResponseDto {
  @ApiProperty({
    description: "Total number of products",
    example: 150,
  })
  totalProducts: number;

  @ApiProperty({
    description: "Total number of active products",
    example: 120,
  })
  activeProducts: number;

  @ApiProperty({
    description: "Total number of orders",
    example: 500,
  })
  totalOrders: number;

  @ApiProperty({
    description: "Total number of pending orders",
    example: 25,
  })
  pendingOrders: number;

  @ApiProperty({
    description: "Total number of customers",
    example: 200,
  })
  totalCustomers: number;

  @ApiProperty({
    description: "Total revenue (sum of all order totals)",
    example: 500000.0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: "Revenue for the current month",
    example: 50000.0,
  })
  monthlyRevenue: number;

  @ApiProperty({
    description: "Average order value",
    example: 2500.0,
  })
  averageOrderValue: number;
}
