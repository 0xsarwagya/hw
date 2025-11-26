import { ApiProperty } from "@nestjs/swagger";
import { OrderItemResponseDto } from "./order-item-response.dto";

export class OrderResponseDto {
  @ApiProperty({
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Customer ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  customerId: string;

  @ApiProperty({
    description: "Unique order number",
    example: "ORD-2025-001234",
  })
  orderNumber: string;

  @ApiProperty({
    description: "Order status",
    example: "pending",
    enum: [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ],
  })
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";

  @ApiProperty({
    description: "Order subtotal (before GST and shipping)",
    example: 1999.98,
  })
  subtotal: number;

  @ApiProperty({
    description: "Total GST amount",
    example: 359.99,
  })
  gstAmount: number;

  @ApiProperty({
    description: "Shipping cost",
    example: 50.0,
  })
  shippingCost: number;

  @ApiProperty({
    description: "Order total (subtotal + GST + shipping)",
    example: 2409.97,
  })
  total: number;

  @ApiProperty({
    description: "Razorpay order ID (if payment initiated)",
    example: "order_abc123",
    nullable: true,
  })
  razorpayOrderId: string | null;

  @ApiProperty({
    description: "Shipping provider",
    example: "shiprocket",
    nullable: true,
  })
  shippingProvider: string | null;

  @ApiProperty({
    description: "Shipping address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  shippingAddressId: string;

  @ApiProperty({
    description: "Billing address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  billingAddressId: string;

  @ApiProperty({
    description: "Order items",
    type: [OrderItemResponseDto],
  })
  items: OrderItemResponseDto[];

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
