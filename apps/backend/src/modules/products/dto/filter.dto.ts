import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export enum SortField {
  PRICE = "price",
  NAME = "name",
  DATE = "date",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class FilterProductsDto {
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

  @ApiProperty({
    description: "Filter by category ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: "Category ID must be a valid UUID" })
  categoryId?: string;

  @ApiProperty({
    description: "Minimum price filter (INR)",
    example: 1000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Min price must be a number" })
  @Min(0, { message: "Min price must be greater than or equal to 0" })
  minPrice?: number;

  @ApiProperty({
    description: "Maximum price filter (INR)",
    example: 5000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Max price must be a number" })
  @Min(0, { message: "Max price must be greater than or equal to 0" })
  maxPrice?: number;

  @ApiProperty({
    description: "Filter by availability (in stock only)",
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "In stock must be a boolean" })
  inStock?: boolean;

  @ApiProperty({
    description: "Filter by status",
    example: "active",
    enum: ["draft", "active", "archived"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["draft", "active", "archived"], {
    message: "Status must be one of: draft, active, archived",
  })
  status?: "draft" | "active" | "archived";

  @ApiProperty({
    description: "Sort field",
    example: "price",
    enum: SortField,
    default: SortField.DATE,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortField, {
    message: `Sort field must be one of: ${Object.values(SortField).join(", ")}`,
  })
  sortBy?: SortField = SortField.DATE;

  @ApiProperty({
    description: "Sort order",
    example: "asc",
    enum: SortOrder,
    default: SortOrder.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: `Sort order must be one of: ${Object.values(SortOrder).join(", ")}`,
  })
  sortOrder?: SortOrder = SortOrder.DESC;
}
