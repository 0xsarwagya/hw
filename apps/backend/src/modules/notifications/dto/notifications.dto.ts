import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { NotificationType } from "../types/notification.types";

export class CreateNotificationDto {
  @ApiPropertyOptional({
    description: "Admin user ID (null for broadcast notifications)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  adminId?: string | null;

  @ApiProperty({
    description: "Notification type",
    enum: NotificationType,
    example: NotificationType.ORDER,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: "Notification title (max 120 characters)",
    example: "New Order Received",
    maxLength: 120,
  })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({
    description: "Notification message",
    example: "Order #12345 has been placed",
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: "Additional metadata",
    example: { orderId: "123e4567-e89b-12d3-a456-426614174000" },
  })
  @IsOptional()
  meta?: Record<string, unknown>;
}

export class QueryNotificationsDto {
  @ApiPropertyOptional({
    description: "Page number",
    example: 1,
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: "Items per page",
    example: 20,
    default: 20,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: "Filter by notification type",
    enum: NotificationType,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: "Filter by read status",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class MarkReadDto {
  @ApiProperty({
    description: "Notification ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  id: string;
}

export class NotificationResponseDto {
  @ApiProperty({
    description: "Notification ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiPropertyOptional({
    description: "Admin user ID (null for broadcast)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  adminId?: string | null;

  @ApiProperty({
    description: "Notification type",
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty({
    description: "Notification title",
  })
  title: string;

  @ApiProperty({
    description: "Notification message",
  })
  message: string;

  @ApiPropertyOptional({
    description: "Additional metadata",
  })
  meta?: Record<string, unknown> | null;

  @ApiProperty({
    description: "Read status",
  })
  read: boolean;

  @ApiProperty({
    description: "Creation timestamp",
  })
  createdAt: Date;
}

export class PaginatedNotificationsResponseDto {
  @ApiProperty({
    description: "List of notifications",
    type: [NotificationResponseDto],
  })
  data: NotificationResponseDto[];

  @ApiProperty({
    description: "Total number of notifications",
  })
  total: number;

  @ApiProperty({
    description: "Current page number",
  })
  page: number;

  @ApiProperty({
    description: "Items per page",
  })
  limit: number;

  @ApiProperty({
    description: "Total number of pages",
  })
  totalPages: number;
}
