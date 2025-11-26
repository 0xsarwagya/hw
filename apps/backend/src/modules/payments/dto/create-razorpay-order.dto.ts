import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class CreateRazorpayOrderDto {
  @ApiProperty({
    description: "Order ID from the system",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID("4", { message: "Order ID must be a valid UUID" })
  @IsNotEmpty({ message: "Order ID is required" })
  orderId: string;

  @ApiProperty({
    description: "Amount in paise (e.g., 100000 for ₹1000)",
    example: 100000,
  })
  @IsNumber({}, { message: "Amount must be a number" })
  @Min(1, { message: "Amount must be at least 1 paise" })
  @IsNotEmpty({ message: "Amount is required" })
  amount: number;

  @ApiProperty({
    description: "Currency code (default: INR)",
    example: "INR",
    default: "INR",
    required: false,
  })
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: "Receipt ID for tracking",
    example: "receipt_123456",
    required: false,
  })
  @IsOptional()
  receipt?: string;

  @ApiProperty({
    description: "Payment capture (1 for auto-capture, 0 for manual)",
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  paymentCapture?: number;

  @ApiProperty({
    description: "Notes for the order",
    example: { order_number: "ORD-2025-001234" },
    required: false,
  })
  @IsOptional()
  notes?: Record<string, string>;
}

export class RazorpayOrderResponseDto {
  @ApiProperty({
    description: "Razorpay order ID",
    example: "order_MNOPQRSTUVWXYZ",
  })
  id: string;

  @ApiProperty({
    description: "Order entity type",
    example: "order",
  })
  entity: string;

  @ApiProperty({
    description: "Amount in paise",
    example: 100000,
  })
  amount: number;

  @ApiProperty({
    description: "Amount paid in paise",
    example: 0,
  })
  amount_paid: number;

  @ApiProperty({
    description: "Amount due in paise",
    example: 100000,
  })
  amount_due: number;

  @ApiProperty({
    description: "Currency code",
    example: "INR",
  })
  currency: string;

  @ApiProperty({
    description: "Receipt ID",
    example: "receipt_123456",
    nullable: true,
  })
  receipt: string | null;

  @ApiProperty({
    description: "Order status",
    example: "created",
  })
  status: string;

  @ApiProperty({
    description: "Number of attempts",
    example: 0,
  })
  attempts: number;

  @ApiProperty({
    description: "Notes",
    example: { order_number: "ORD-2025-001234" },
    nullable: true,
  })
  notes: Record<string, string> | null;

  @ApiProperty({
    description: "Created timestamp",
    example: 1234567890,
  })
  created_at: number;
}
