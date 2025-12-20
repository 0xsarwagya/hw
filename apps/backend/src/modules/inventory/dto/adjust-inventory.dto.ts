import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export enum InventoryAdjustmentType {
  INCREASE = "increase",
  DECREASE = "decrease",
  SET = "set",
}

export enum InventoryAdjustmentReason {
  RECEIVED = "received",
  CORRECTION = "correction",
  DAMAGED = "damaged",
  LOST = "lost",
  RETURNED = "returned",
  GIVEAWAY = "giveaway",
  MANUAL = "manual",
}

export class AdjustInventoryDto {
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
    example: "Received new stock shipment",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Note must be a string" })
  note?: string;
}

export class InventoryAdjustmentResponseDto {
  @ApiProperty({
    description: "Adjustment ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Old inventory quantity",
    example: 90,
  })
  oldQuantity: number;

  @ApiProperty({
    description: "New inventory quantity",
    example: 100,
  })
  newQuantity: number;

  @ApiProperty({
    description: "Delta (change amount)",
    example: 10,
  })
  delta: number;

  @ApiProperty({
    description: "Adjustment type",
    enum: InventoryAdjustmentType,
    example: InventoryAdjustmentType.INCREASE,
  })
  type: InventoryAdjustmentType;

  @ApiProperty({
    description: "Adjustment reason",
    enum: InventoryAdjustmentReason,
    example: InventoryAdjustmentReason.RECEIVED,
  })
  reason: InventoryAdjustmentReason;

  @ApiProperty({
    description: "Optional note",
    example: "Received new stock shipment",
    required: false,
  })
  note?: string;

  @ApiProperty({
    description: "Admin ID who made the adjustment",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  actorAdminId: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-01-15T10:30:00Z",
  })
  createdAt: Date;
}
