import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

export class CalculateShippingRateDto {
  @ApiProperty({
    description: "PIN code for delivery",
    example: "110001",
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: "PIN code must be exactly 6 digits" })
  pincode: string;

  @ApiProperty({
    description: "Weight of the package in grams",
    example: 500,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  weight: number;

  @ApiProperty({
    description: "Whether to include COD charges",
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsNotEmpty()
  isCod?: boolean;
}

export class ShippingCalculationResponseDto {
  @ApiProperty({
    description: "Base shipping rate",
    example: 50,
  })
  baseRate: number;

  @ApiProperty({
    description: "Additional charges (weight, etc.)",
    example: 20,
  })
  additionalCharges: number;

  @ApiProperty({
    description: "COD handling charge",
    example: 30,
    required: false,
  })
  codCharge?: number;

  @ApiProperty({
    description: "Total shipping rate",
    example: 100,
  })
  totalRate: number;

  @ApiProperty({
    description: "Estimated delivery days",
    example: 3,
  })
  estimatedDays: number;

  @ApiProperty({
    description: "Whether COD is available",
    example: true,
  })
  isCodAvailable: boolean;

  @ApiProperty({
    description: "Shipping zone",
    example: "metro",
    enum: ["metro", "zone_a", "zone_b", "zone_c", "zone_d", "zone_e"],
  })
  zone: string;
}
