import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * Page-based pagination request DTO
 */
export class PagePaginationDto {
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

/**
 * Cursor-based pagination request DTO
 */
export class CursorPaginationDto {
  @ApiProperty({
    description: "Cursor for pagination (base64 encoded)",
    example: "eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCJ9",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Cursor must be a string" })
  cursor?: string;

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

/**
 * Pagination metadata response DTO
 */
export class PaginationMetadataDto {
  @ApiProperty({
    description: "Total number of items",
    example: 100,
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
    example: 10,
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
}

/**
 * Cursor pagination metadata response DTO
 */
export class CursorPaginationMetadataDto {
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
    description: "Cursor for the first item in the result set",
    example: "eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCJ9",
    required: false,
  })
  startCursor?: string;

  @ApiProperty({
    description: "Cursor for the last item in the result set",
    example: "eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCJ9",
    required: false,
  })
  endCursor?: string;
}

/**
 * Generic paginated response DTO
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: "List of items",
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: "Pagination metadata",
    type: PaginationMetadataDto,
  })
  pagination: PaginationMetadataDto;
}

/**
 * Generic cursor-paginated response DTO
 */
export class CursorPaginatedResponseDto<T> {
  @ApiProperty({
    description: "List of items",
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: "Cursor pagination metadata",
    type: CursorPaginationMetadataDto,
  })
  pagination: CursorPaginationMetadataDto;
}
