import { ApiProperty } from "@nestjs/swagger";
import { shipmentStatusEnum } from "@vcecom/db";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { ShipmentResponseDto } from "./shipment-response.dto";

export class ListShipmentsQueryDto {
  @ApiProperty({
    description: "Filter by order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID("4", { message: "Order ID must be a valid UUID" })
  orderId?: string;

  @ApiProperty({
    description: "Filter by shipment status",
    enum: shipmentStatusEnum.enumValues,
    required: false,
  })
  @IsOptional()
  @IsEnum(shipmentStatusEnum.enumValues, { message: "Invalid shipment status" })
  status?: (typeof shipmentStatusEnum.enumValues)[number];

  @ApiProperty({
    description: "Filter by shipping provider",
    example: "shiprocket",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Provider must be a string" })
  provider?: string;

  @ApiProperty({
    description: "Filter shipments from this date (ISO 8601 format)",
    example: "2025-01-01T00:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid ISO 8601 date" })
  startDate?: string;

  @ApiProperty({
    description: "Filter shipments until this date (ISO 8601 format)",
    example: "2025-12-31T23:59:59Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "End date must be a valid ISO 8601 date" })
  endDate?: string;

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
    example: 10,
    default: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be greater than or equal to 1" })
  @Max(100, { message: "Limit must be less than or equal to 100" })
  limit?: number = 10;
}

export class PaginatedShipmentsResponseDto {
  @ApiProperty({
    description: "List of shipments",
    type: [ShipmentResponseDto],
  })
  data: ShipmentResponseDto[];

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
