import { ApiProperty } from "@nestjs/swagger";

export class ShipmentResponseDto {
  @ApiProperty({
    description: "Shipment ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  orderId: string;

  @ApiProperty({
    description: "Shipping provider",
    example: "shiprocket",
  })
  provider: string;

  @ApiProperty({
    description: "Tracking number",
    example: "SR123456789",
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
    description: "AWB (Airway Bill) number",
    example: "AWB123456789",
    nullable: true,
  })
  awbNumber: string | null;

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
