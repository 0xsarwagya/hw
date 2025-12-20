import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../../common/constants/pagination.constants";

export class ListInventoryQueryDto {
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
    description: "Search query (searches in SKU and product title)",
    example: "TSHIRT-BLACK-M",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Search query must be a string" })
  search?: string;

  @ApiProperty({
    description: "Filter by product status",
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
    description: "Filter by low stock items only",
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Low stock must be a boolean" })
  lowStock?: boolean;

  @ApiProperty({
    description: "Filter by out of stock items only",
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Out of stock must be a boolean" })
  outOfStock?: boolean;

  @ApiProperty({
    description: "Filter by category ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: "Category ID must be a valid UUID" })
  categoryId?: string;

  @ApiProperty({
    description: "Sort field",
    example: "inventory",
    enum: ["inventory", "committed", "updatedAt"],
    default: "updatedAt",
    required: false,
  })
  @IsOptional()
  @IsEnum(["inventory", "committed", "updatedAt"], {
    message: "Sort by must be one of: inventory, committed, updatedAt",
  })
  sortBy?: "inventory" | "committed" | "updatedAt" = "updatedAt";

  @ApiProperty({
    description: "Sort order",
    example: "desc",
    enum: ["asc", "desc"],
    default: "desc",
    required: false,
  })
  @IsOptional()
  @IsEnum(["asc", "desc"], {
    message: "Sort order must be one of: asc, desc",
  })
  sortOrder?: "asc" | "desc" = "desc";
}

export class InventoryListItemDto {
  @ApiProperty({
    description: "Variant ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  variantId: string;

  @ApiProperty({
    description: "Product ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  productId: string;

  @ApiProperty({
    description: "SKU",
    example: "TSHIRT-BLACK-M",
  })
  sku: string;

  @ApiProperty({
    description: "Product title",
    example: "Premium T-Shirt",
  })
  title: string;

  @ApiProperty({
    description: "Variant attributes (size, color, etc.)",
    example: { size: "M", color: "Black" },
    required: false,
  })
  attributes?: Record<string, string>;

  @ApiProperty({
    description: "Total inventory quantity",
    example: 100,
  })
  inventory: number;

  @ApiProperty({
    description: "Committed/reserved inventory quantity",
    example: 15,
  })
  committed: number;

  @ApiProperty({
    description: "Available inventory (inventory - committed)",
    example: 85,
  })
  available: number;

  @ApiProperty({
    description: "Whether this variant is low stock",
    example: false,
  })
  lowStock: boolean;

  @ApiProperty({
    description: "Last updated timestamp",
    example: "2025-01-15T10:30:00Z",
  })
  updatedAt: Date;
}

export class PaginatedInventoryResponseDto {
  @ApiProperty({
    description: "List of inventory items",
    type: [InventoryListItemDto],
  })
  data: InventoryListItemDto[];

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
