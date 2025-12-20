import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../../common/constants";

export class AdminQueryActivityLogsDto {
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
    description: "Filter by admin user ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: "Admin ID must be a valid UUID" })
  adminId?: string;

  @ApiProperty({
    description: "Filter by action (e.g., 'product.create', 'login.success')",
    example: "product.create",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Action must be a string" })
  action?: string;

  @ApiProperty({
    description:
      "Filter by resource type (e.g., 'product', 'order', 'auth'). Extracted from action.",
    example: "product",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Resource must be a string" })
  resource?: string;

  @ApiProperty({
    description: "Start date for filtering (ISO 8601 format)",
    example: "2025-01-01T00:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Start date must be a string" })
  startDate?: string;

  @ApiProperty({
    description: "End date for filtering (ISO 8601 format)",
    example: "2025-12-31T23:59:59Z",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "End date must be a string" })
  endDate?: string;

  @ApiProperty({
    description: "Search query (searches in admin email, action, entityId)",
    example: "product",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Search must be a string" })
  search?: string;
}

export class ActivityLogResponseDto {
  @ApiProperty({
    description: "Activity log ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Admin user ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  adminId: string;

  @ApiProperty({
    description: "Admin email",
    example: "admin@example.com",
    nullable: true,
  })
  adminEmail: string | null;

  @ApiProperty({
    description: "Action performed",
    example: "product.create",
  })
  action: string;

  @ApiProperty({
    description: "Resource type extracted from action",
    example: "product",
    nullable: true,
  })
  resource: string | null;

  @ApiProperty({
    description: "Entity ID affected by the action",
    example: "product-123",
    nullable: true,
  })
  entityId: string | null;

  @ApiProperty({
    description: "Additional metadata",
    example: { title: "New Product", price: 99.99 },
    nullable: true,
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty({
    description: "Before/after state diff",
    example: { before: { title: "Old Name" }, after: { title: "New Name" } },
    nullable: true,
  })
  diff: {
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  } | null;

  @ApiProperty({
    description: "IP address",
    example: "192.168.1.1",
    nullable: true,
  })
  ipAddress: string | null;

  @ApiProperty({
    description: "User agent",
    example: "Mozilla/5.0...",
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-12-18T00:00:00.000Z",
  })
  createdAt: Date;
}

export class PaginatedActivityLogsResponseDto {
  @ApiProperty({
    description: "List of activity logs",
    type: [ActivityLogResponseDto],
  })
  data: ActivityLogResponseDto[];

  @ApiProperty({
    description: "Total number of logs matching the query",
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
