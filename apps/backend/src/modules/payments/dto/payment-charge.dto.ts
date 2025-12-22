import { ApiProperty } from "@nestjs/swagger";

export class PaymentFeeBreakdownDto {
  @ApiProperty({
    description: "Payment method",
    example: "COD",
  })
  method: string;

  @ApiProperty({
    description: "Charge type",
    example: "FLAT",
    enum: ["FLAT", "PERCENTAGE", "MIXED"],
  })
  chargeType: string;

  @ApiProperty({
    description: "Flat amount in rupees",
    example: 30,
  })
  flatAmount?: number;

  @ApiProperty({
    description: "Percentage rate",
    example: 2.5,
  })
  percentage?: number;

  @ApiProperty({
    description: "Calculated fee in rupees",
    example: 30,
  })
  calculatedFee: number;

  @ApiProperty({
    description: "Minimum charge in rupees (for MIXED type)",
    required: false,
  })
  mixMin?: number;

  @ApiProperty({
    description: "Maximum cap in rupees (for MIXED type)",
    required: false,
  })
  mixCap?: number;
}

export class PaymentMethodWithFeeDto {
  @ApiProperty({
    description: "Payment method code",
    example: "COD",
  })
  method: string;

  @ApiProperty({
    description: "Payment method label",
    example: "Cash on Delivery",
  })
  label: string;

  @ApiProperty({
    description: "Calculated fee in rupees",
    example: 30,
  })
  fee: number;

  @ApiProperty({
    description: "Fee breakdown details",
    type: PaymentFeeBreakdownDto,
  })
  breakdown: PaymentFeeBreakdownDto;

  @ApiProperty({
    description: "Whether this method is available",
    example: true,
  })
  available: boolean;

  @ApiProperty({
    description: "Reason why method is unavailable (if available is false)",
    required: false,
  })
  unavailableReason?: string;
}

export class CalculateFeeDto {
  @ApiProperty({
    description: "Payment method",
    example: "COD",
  })
  method: string;

  @ApiProperty({
    description: "Cart total in rupees",
    example: 1000,
  })
  cartTotal: number;

  @ApiProperty({
    description: "Currency code",
    example: "INR",
    default: "INR",
  })
  currency?: string;
}

export class PreviewFeeDto {
  @ApiProperty({
    description: "Payment method charge configuration ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  chargeId: string;

  @ApiProperty({
    description: "Test cart total in rupees",
    example: 1000,
  })
  cartTotal: number;
}
