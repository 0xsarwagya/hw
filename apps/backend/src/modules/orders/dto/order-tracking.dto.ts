import { ApiProperty } from "@nestjs/swagger";

export class ShipmentTrackingDto {
  @ApiProperty({
    description: "Shipment ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Shipping provider",
    example: "shiprocket",
  })
  provider: string;

  @ApiProperty({
    description: "Tracking number",
    example: "TRACK123456789",
    nullable: true,
  })
  trackingNumber: string | null;

  @ApiProperty({
    description: "Shipment status",
    example: "in_transit",
    enum: [
      "pending",
      "label_generated",
      "picked_up",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "failed",
      "returned",
      "cancelled",
    ],
  })
  status:
    | "pending"
    | "label_generated"
    | "picked_up"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed"
    | "returned"
    | "cancelled";

  @ApiProperty({
    description: "Label URL",
    example: "https://example.com/label.pdf",
    nullable: true,
  })
  labelUrl: string | null;

  @ApiProperty({
    description: "AWB Number (Airway Bill Number)",
    example: "AWB123456789",
    nullable: true,
  })
  awbNumber: string | null;

  @ApiProperty({
    description: "Shipment creation timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Shipment last update timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  updatedAt: Date;
}

export class OrderTrackingDto {
  @ApiProperty({
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  orderId: string;

  @ApiProperty({
    description: "Order number",
    example: "ORD-2025-001234",
  })
  orderNumber: string;

  @ApiProperty({
    description: "Current order status",
    example: "shipped",
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
    description: "Shipping provider",
    example: "shiprocket",
    nullable: true,
  })
  shippingProvider: string | null;

  @ApiProperty({
    description: "Shipments associated with this order",
    type: [ShipmentTrackingDto],
  })
  shipments: ShipmentTrackingDto[];

  @ApiProperty({
    description: "Order creation timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Order last update timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  updatedAt: Date;
}
