import { ApiProperty } from "@nestjs/swagger";

export class TrackingEventDto {
  @ApiProperty({
    description: "Event date and time",
    example: "2025-11-26T10:30:00Z",
  })
  date: string;

  @ApiProperty({
    description: "Event status",
    example: "In Transit",
  })
  status: string;

  @ApiProperty({
    description: "Event location",
    example: "Mumbai",
    nullable: true,
  })
  location: string | null;

  @ApiProperty({
    description: "Event description",
    example: "Shipment picked up from origin",
    nullable: true,
  })
  description: string | null;
}

export class TrackShipmentResponseDto {
  @ApiProperty({
    description: "AWB (Airway Bill) number",
    example: "AWB123456789",
  })
  awbNumber: string;

  @ApiProperty({
    description: "Tracking number",
    example: "SR123456789",
  })
  trackingNumber: string;

  @ApiProperty({
    description: "Current shipment status",
    example: "in_transit",
  })
  status: string;

  @ApiProperty({
    description: "Current status description",
    example: "In Transit",
  })
  statusDescription: string;

  @ApiProperty({
    description: "Estimated delivery date",
    example: "2025-11-28",
    nullable: true,
  })
  estimatedDeliveryDate: string | null;

  @ApiProperty({
    description: "Tracking events timeline",
    type: [TrackingEventDto],
  })
  events: TrackingEventDto[];

  @ApiProperty({
    description: "Message regarding tracking",
    example: "Tracking information retrieved successfully",
  })
  message: string;
}
