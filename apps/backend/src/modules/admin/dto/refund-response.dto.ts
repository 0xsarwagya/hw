import { ApiProperty } from "@nestjs/swagger";

export class RefundResponseDto {
  @ApiProperty({
    description: "Refund ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  orderId: string;

  @ApiProperty({
    description: "Refund amount in INR",
    example: 500.0,
  })
  amount: number;

  @ApiProperty({
    description: "Reason for refund",
    example: "Customer returned item",
  })
  reason: string;

  @ApiProperty({
    description: "Refund status",
    example: "pending",
    enum: ["pending", "completed", "failed"],
  })
  status: "pending" | "completed" | "failed";

  @ApiProperty({
    description: "Provider refund ID (e.g., Razorpay refund ID)",
    example: "rfnd_abc123",
    nullable: true,
  })
  providerRefundId: string | null;

  @ApiProperty({
    description: "When refund was processed",
    example: "2025-11-26T00:00:00.000Z",
    nullable: true,
  })
  processedAt: Date | null;

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

