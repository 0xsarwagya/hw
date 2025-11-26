import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class AdminQueryCustomersDto {
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
    description: "Search query (searches in name, email, phone)",
    example: "john@example.com",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Search query must be a string" })
  search?: string;
}

export class CustomerResponseDto {
  @ApiProperty({
    description: "Customer ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  userId: string;

  @ApiProperty({
    description: "Customer email",
    example: "customer@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Customer phone",
    example: "+919876543210",
  })
  phone: string;

  @ApiProperty({
    description: "Customer name",
    example: "John Doe",
  })
  name: string;

  @ApiProperty({
    description: "GSTIN (if available)",
    example: "27AABCU9603R1ZX",
    nullable: true,
  })
  gstin: string | null;

  @ApiProperty({
    description: "Customer creation date",
    example: "2025-01-01T00:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Customer last update date",
    example: "2025-01-01T00:00:00Z",
  })
  updatedAt: Date;
}

export class PaginatedCustomersResponseDto {
  @ApiProperty({
    description: "List of customers",
    type: [CustomerResponseDto],
  })
  data: CustomerResponseDto[];

  @ApiProperty({
    description: "Total number of customers",
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
}
