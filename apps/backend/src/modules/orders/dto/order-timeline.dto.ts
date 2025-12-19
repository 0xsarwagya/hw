import { ApiProperty } from "@nestjs/swagger";

export enum TimelineEventType {
  ORDER_CREATED = "order_created",
  ORDER_CONFIRMED = "order_confirmed",
  ORDER_PROCESSING = "order_processing",
  ORDER_SHIPPED = "order_shipped",
  ORDER_DELIVERED = "order_delivered",
  ORDER_CANCELLED = "order_cancelled",
  STATUS_CHANGED = "status_changed",
  PAYMENT_INITIATED = "payment_initiated",
  PAYMENT_COMPLETED = "payment_completed",
  PAYMENT_FAILED = "payment_failed",
  SHIPMENT_CREATED = "shipment_created",
  SHIPMENT_TRACKING_UPDATED = "shipment_tracking_updated",
  SHIPMENT_LABEL_GENERATED = "shipment_label_generated",
  SHIPMENT_PICKED_UP = "shipment_picked_up",
  SHIPMENT_IN_TRANSIT = "shipment_in_transit",
  SHIPMENT_OUT_FOR_DELIVERY = "shipment_out_for_delivery",
  SHIPMENT_DELIVERED = "shipment_delivered",
  SHIPMENT_FAILED = "shipment_failed",
  SHIPMENT_RETURNED = "shipment_returned",
}

export class TimelineEventDto {
  @ApiProperty({
    description: "Event type",
    enum: TimelineEventType,
    example: "status_changed",
  })
  type: TimelineEventType;

  @ApiProperty({
    description: "Event title",
    example: "Order Status Changed",
  })
  title: string;

  @ApiProperty({
    description: "Event description",
    example: "Order status changed from 'pending' to 'confirmed'",
  })
  description: string;

  @ApiProperty({
    description: "Previous value (if applicable)",
    example: "pending",
    nullable: true,
  })
  previousValue?: string | null;

  @ApiProperty({
    description: "New value (if applicable)",
    example: "confirmed",
    nullable: true,
  })
  newValue?: string | null;

  @ApiProperty({
    description: "Event timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  timestamp: Date;

  @ApiProperty({
    description: "Additional metadata",
    example: { trackingNumber: "TRACK123456789" },
    nullable: true,
  })
  metadata?: Record<string, unknown> | null;
}

export class OrderTimelineDto {
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
  currentStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";

  @ApiProperty({
    description: "Timeline events (ordered by timestamp, newest first)",
    type: [TimelineEventDto],
  })
  events: TimelineEventDto[];
}
