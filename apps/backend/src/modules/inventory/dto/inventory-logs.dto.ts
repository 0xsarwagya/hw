import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../../common/constants/pagination.constants";
import {
  InventoryAdjustmentReason,
  InventoryAdjustmentType,
} from "./adjust-inventory.dto";

export class InventoryLogsQueryDto {
  @ApiProperty({
    description: "Page number (1-indexed)",
    example: 1,
    default: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Page must be an integer" })
  @Min(1, { message: "Page must be greater than or equal to 1" })
  page?: number = 1;

  @ApiProperty({
    description: "Number of items per page",
    example: DEFAULT_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
    required: false,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be greater than or equal to 1" })
  @Max(MAX_PAGE_SIZE, {
    message: `Limit must be less than or equal to ${MAX_PAGE_SIZE}`,
  })
  limit?: number = DEFAULT_PAGE_SIZE;

  @ApiProperty({
    description: "Filter logs from this date (ISO 8601 format)",
    example: "2025-01-01T00:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid ISO 8601 date" })
  startDate?: string;

  @ApiProperty({
    description: "Filter logs until this date (ISO 8601 format)",
    example: "2025-12-31T23:59:59Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "End date must be a valid ISO 8601 date" })
  endDate?: string;

  @ApiProperty({
    description: "Filter by admin ID who made the adjustment",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: "Actor admin ID must be a valid UUID" })
  actor?: string;

  @ApiProperty({
    description: "Filter by adjustment reason",
    enum: InventoryAdjustmentReason,
    required: false,
  })
  @IsOptional()
  @IsEnum(InventoryAdjustmentReason, {
    message: "Invalid adjustment reason",
  })
  reason?: InventoryAdjustmentReason;

  @ApiProperty({
    description: "Filter by adjustment type",
    enum: InventoryAdjustmentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(InventoryAdjustmentType, {
    message: "Invalid adjustment type",
  })
  type?: InventoryAdjustmentType;

  @ApiProperty({
    description: "Filter by order ID (from metadata)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: "Order ID must be a valid UUID" })
  orderId?: string;

  @ApiProperty({
    description: "Filter by refund ID (from metadata)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: "Refund ID must be a valid UUID" })
  refundId?: string;
}

export class InventoryLogEntryDto {
  @ApiProperty({
    description: "Log entry ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Delta (change amount)",
    example: 10,
  })
  delta: number;

  @ApiProperty({
    description: "Old inventory quantity",
    example: 90,
  })
  oldInventory: number;

  @ApiProperty({
    description: "New inventory quantity",
    example: 100,
  })
  newInventory: number;

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
    description: "Admin ID who made the adjustment",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  actorAdminId: string;

  @ApiProperty({
    description: "Optional metadata (orderId, refundId, etc.)",
    example: { orderId: "123e4567-e89b-12d3-a456-426614174000" },
    required: false,
  })
  metadata?: {
    orderId?: string;
    refundId?: string;
    [key: string]: unknown;
  };

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-01-15T10:30:00Z",
  })
  createdAt: Date;
}

export class PaginatedInventoryLogsResponseDto {
  @ApiProperty({
    description: "List of inventory log entries",
    type: [InventoryLogEntryDto],
  })
  data: InventoryLogEntryDto[];

  @ApiProperty({
    description: "Pagination information",
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
