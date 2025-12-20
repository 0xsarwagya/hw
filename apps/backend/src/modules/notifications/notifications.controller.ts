import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request as ExpressRequest } from "express";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../common/constants";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import {
  MarkReadDto,
  PaginatedNotificationsResponseDto,
  QueryNotificationsDto,
} from "./dto/notifications.dto";
import { NotificationsService } from "./notifications.service";

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email?: string;
    role?: string;
  };
}

@ApiTags("admin")
@Controller("admin/notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin", "support", "reviewer", "marketing")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get all notifications (admin)",
    description:
      "Retrieve a paginated list of notifications for the authenticated admin. Includes broadcast notifications (adminId is null) and admin-specific notifications.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: `Items per page (default: ${DEFAULT_PAGE_SIZE}, max: ${MAX_PAGE_SIZE})`,
  })
  @ApiQuery({
    name: "type",
    required: false,
    enum: ["ORDER", "INVENTORY", "REVIEW", "SHIPPING", "PAYMENT", "SYSTEM"],
    description: "Filter by notification type",
  })
  @ApiQuery({
    name: "read",
    required: false,
    type: Boolean,
    description: "Filter by read status",
  })
  @ApiResponse({
    status: 200,
    description: "List of notifications retrieved successfully",
    type: PaginatedNotificationsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getNotifications(
    @Request() req: AuthenticatedRequest,
    @Query() query: QueryNotificationsDto,
  ): Promise<PaginatedNotificationsResponseDto> {
    return this.notificationsService.findAll(req.user.id, query);
  }

  @Post("mark-read")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Mark notification as read (admin)",
    description:
      "Mark a single notification as read for the authenticated admin.",
  })
  @ApiResponse({
    status: 200,
    description: "Notification marked as read successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Notification not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async markRead(
    @Request() req: AuthenticatedRequest,
    @Body() dto: MarkReadDto,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markRead(req.user.id, dto.id);
    return { success: true };
  }

  @Post("mark-all-read")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Mark all notifications as read (admin)",
    description:
      "Mark all unread notifications as read for the authenticated admin.",
  })
  @ApiResponse({
    status: 200,
    description: "All notifications marked as read successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async markAllRead(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAllRead(req.user.id);
    return { success: true };
  }

  @Delete(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Delete notification (admin)",
    description: "Delete a notification for the authenticated admin.",
  })
  @ApiParam({
    name: "id",
    description: "Notification ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Notification deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Notification not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async deleteNotification(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.delete(req.user.id, id);
    return { success: true };
  }
}
