import { ApiProperty } from "@nestjs/swagger";

export class OrderItemResponseDto {
  @ApiProperty({
    description: "Order item ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  orderId: string;

  @ApiProperty({
    description: "Product variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  productVariantId: string;

  @ApiProperty({
    description: "Quantity",
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: "Price at time of order",
    example: 999.99,
  })
  price: number;

  @ApiProperty({
    description: "GST rate percentage",
    example: 18,
  })
  gstRate: number;

  @ApiProperty({
    description: "GST amount",
    example: 359.99,
  })
  gstAmount: number;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  updatedAt: Date;
}
