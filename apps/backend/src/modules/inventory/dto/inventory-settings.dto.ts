import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsObject, IsOptional, Min } from "class-validator";

export class PerVariantOverridesDto {
  [variantId: string]: number;
}

export class UpdateInventorySettingsDto {
  @ApiProperty({
    description: "Global low stock threshold",
    example: 5,
    minimum: 0,
  })
  @IsInt({ message: "Global low stock threshold must be an integer" })
  @Min(0, {
    message: "Global low stock threshold must be greater than or equal to 0",
  })
  @IsNotEmpty({ message: "Global low stock threshold is required" })
  @Type(() => Number)
  globalLowStockThreshold: number;

  @ApiProperty({
    description: "Per-variant threshold overrides (variantId -> threshold)",
    example: {
      "123e4567-e89b-12d3-a456-426614174000": 10,
      "223e4567-e89b-12d3-a456-426614174000": 2,
    },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: "Per variant overrides must be an object" })
  perVariantOverrides?: Record<string, number>;
}

export class InventorySettingsResponseDto {
  @ApiProperty({
    description: "Settings ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Global low stock threshold",
    example: 5,
  })
  globalLowStockThreshold: number;

  @ApiProperty({
    description: "Per-variant threshold overrides",
    example: {
      "123e4567-e89b-12d3-a456-426614174000": 10,
    },
    required: false,
  })
  perVariantOverrides?: Record<string, number>;

  @ApiProperty({
    description: "Last updated timestamp",
    example: "2025-01-15T10:30:00Z",
  })
  updatedAt: Date;

  @ApiProperty({
    description: "Admin ID who last updated settings",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  updatedBy?: string;
}
