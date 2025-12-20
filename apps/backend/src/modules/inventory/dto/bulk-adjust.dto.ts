import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import {
  InventoryAdjustmentReason,
  InventoryAdjustmentType,
} from "./adjust-inventory.dto";

export class BulkAdjustmentItemDto {
  @ApiProperty({
    description: "SKU of the variant to adjust",
    example: "TSHIRT-BLACK-M",
  })
  @IsString({ message: "SKU must be a string" })
  @IsNotEmpty({ message: "SKU is required" })
  sku: string;

  @ApiProperty({
    description: "Adjustment type",
    enum: InventoryAdjustmentType,
    example: InventoryAdjustmentType.INCREASE,
  })
  @IsEnum(InventoryAdjustmentType, {
    message: "Type must be one of: increase, decrease, set",
  })
  @IsNotEmpty({ message: "Type is required" })
  type: InventoryAdjustmentType;

  @ApiProperty({
    description: "Quantity to adjust (positive number)",
    example: 10,
    minimum: 1,
  })
  @IsInt({ message: "Quantity must be an integer" })
  @Min(1, { message: "Quantity must be greater than 0" })
  @IsNotEmpty({ message: "Quantity is required" })
  quantity: number;

  @ApiProperty({
    description: "Reason for adjustment",
    enum: InventoryAdjustmentReason,
    example: InventoryAdjustmentReason.RECEIVED,
  })
  @IsEnum(InventoryAdjustmentReason, {
    message:
      "Reason must be one of: received, correction, damaged, lost, returned, giveaway, manual",
  })
  @IsNotEmpty({ message: "Reason is required" })
  reason: InventoryAdjustmentReason;

  @ApiProperty({
    description: "Optional note about the adjustment",
    example: "Incoming stock",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Note must be a string" })
  note?: string;
}

export class BulkAdjustInventoryDto {
  @ApiProperty({
    description: "Array of inventory adjustments",
    type: [BulkAdjustmentItemDto],
    example: [
      {
        sku: "TSHIRT-BLACK-M",
        type: "increase",
        quantity: 10,
        reason: "received",
        note: "Incoming stock",
      },
    ],
  })
  @IsArray({ message: "Adjustments must be an array" })
  @ArrayMinSize(1, { message: "At least one adjustment is required" })
  @ValidateNested({ each: true })
  @Type(() => BulkAdjustmentItemDto)
  adjustments: BulkAdjustmentItemDto[];
}

export class BulkAdjustmentResultDto {
  @ApiProperty({
    description: "SKU",
    example: "TSHIRT-BLACK-M",
  })
  sku: string;

  @ApiProperty({
    description: "Whether the adjustment was successful",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Error message if adjustment failed",
    example: "Variant not found",
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: "Adjustment ID if successful",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  adjustmentId?: string;
}

export class BulkAdjustInventoryResponseDto {
  @ApiProperty({
    description: "Results for each adjustment",
    type: [BulkAdjustmentResultDto],
  })
  results: BulkAdjustmentResultDto[];

  @ApiProperty({
    description: "Total number of adjustments processed",
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: "Number of successful adjustments",
    example: 4,
  })
  successful: number;

  @ApiProperty({
    description: "Number of failed adjustments",
    example: 1,
  })
  failed: number;
}
