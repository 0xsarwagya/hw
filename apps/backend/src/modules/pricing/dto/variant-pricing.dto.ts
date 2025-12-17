import { ApiProperty } from "@nestjs/swagger";

/**
 * Variant pricing information
 */
export class VariantPricingDto {
  @ApiProperty({
    description: "Base price",
    example: 2999.99,
  })
  basePrice: number;

  @ApiProperty({
    description: "Compare-at price (for showing discount)",
    example: 3999.99,
    required: false,
  })
  compareAtPrice?: number;

  @ApiProperty({
    description: "Currency code",
    example: "INR",
    default: "INR",
  })
  currency: string;

  @ApiProperty({
    description: "Sale price (if active)",
    example: 2499.99,
    required: false,
  })
  salePrice?: number;

  @ApiProperty({
    description: "Sale start date",
    example: "2025-01-01T00:00:00.000Z",
    required: false,
  })
  saleStartDate?: Date;

  @ApiProperty({
    description: "Sale end date",
    example: "2025-12-31T23:59:59.999Z",
    required: false,
  })
  saleEndDate?: Date;

  @ApiProperty({
    description: "Whether sale is currently active",
    example: true,
  })
  isOnSale: boolean;

  @ApiProperty({
    description: "Effective price (base or sale, whichever is active)",
    example: 2499.99,
  })
  effectivePrice: number;
}
