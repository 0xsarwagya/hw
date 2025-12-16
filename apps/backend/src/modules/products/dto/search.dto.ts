import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export enum SearchSortBy {
  RELEVANCE = "relevance",
  PRICE = "price",
  NAME = "name",
  DATE = "date",
}

export enum SearchSortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class SearchProductsDto {
  @ApiProperty({
    description:
      "Search query (searches in product name, description, and SKU)",
    example: "wireless headphones",
    required: true,
  })
  @IsString({ message: "Search query must be a string" })
  query: string;

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
  @IsString({ message: "Category ID must be a string" })
  categoryId?: string;

  @ApiProperty({
    description: "Minimum price filter (INR)",
    example: 1000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
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
    description: "Sort field",
    example: "relevance",
    enum: SearchSortBy,
    default: SearchSortBy.RELEVANCE,
    required: false,
  })
  @IsOptional()
  @IsEnum(SearchSortBy, {
    message: `Sort must be one of: ${Object.values(SearchSortBy).join(", ")}`,
  })
  sortBy?: SearchSortBy = SearchSortBy.RELEVANCE;

  @ApiProperty({
    description: "Sort order",
    example: "desc",
    enum: SearchSortOrder,
    default: SearchSortOrder.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SearchSortOrder, {
    message: `Sort order must be one of: ${Object.values(SearchSortOrder).join(", ")}`,
  })
  sortOrder?: SearchSortOrder = SearchSortOrder.DESC;
}

export class SearchResultDto {
  @ApiProperty({
    description: "Product ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Product title",
    example: "Wireless Headphones",
  })
  title: string;

  @ApiProperty({
    description: "Product description",
    example: "High-quality wireless headphones with noise cancellation",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "Product price",
    example: 2999.0,
  })
  price: number;

  @ApiProperty({
    description: "Relevance score (higher is more relevant)",
    example: 0.95,
  })
  relevanceScore: number;

  @ApiProperty({
    description: "Matching SKU if search matched a variant SKU",
    example: "WH-001-BLK",
    nullable: true,
  })
  matchingSku?: string | null;
}

export class SearchResponseDto {
  @ApiProperty({
    description: "Search results",
    type: [SearchResultDto],
  })
  results: SearchResultDto[];

  @ApiProperty({
    description: "Total number of matching products",
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: "Number of items per page",
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: "Whether there is a next page",
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: "Whether there is a previous page",
    example: false,
  })
  hasPreviousPage: boolean;

  @ApiProperty({
    description: "Search query used",
    example: "wireless headphones",
  })
  query: string;
}
