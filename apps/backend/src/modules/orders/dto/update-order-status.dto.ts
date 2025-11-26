import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: "New order status",
    enum: OrderStatus,
    example: "confirmed",
  })
  @IsEnum(OrderStatus, {
    message:
      "Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled, refunded",
  })
  @IsNotEmpty({ message: "Status is required" })
  status: OrderStatus;
}
