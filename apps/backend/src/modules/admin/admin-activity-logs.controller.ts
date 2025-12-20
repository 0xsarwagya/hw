import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../common/constants";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { AdminActivityLogsService } from "./admin-activity-logs.service";
import {
  ActivityLogResponseDto,
  AdminQueryActivityLogsDto,
  PaginatedActivityLogsResponseDto,
} from "./dto/admin-activity-logs.dto";

@ApiTags("admin")
@Controller("admin/activity-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class AdminActivityLogsController {
  constructor(private readonly activityLogsService: AdminActivityLogsService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get all activity logs (admin)",
    description:
      "Retrieve a paginated list of admin activity logs with filters. Admin-only endpoint.",
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
    name: "adminId",
    required: false,
    type: String,
    description: "Filter by admin user ID",
  })
  @ApiQuery({
    name: "action",
    required: false,
    type: String,
    description: "Filter by action (e.g., 'product.create', 'login.success')",
  })
  @ApiQuery({
    name: "resource",
    required: false,
    type: String,
    description:
      "Filter by resource type (e.g., 'product', 'order', 'auth'). Extracted from action.",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date for filtering (ISO 8601 format)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date for filtering (ISO 8601 format)",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search query (searches in admin email, action, entityId)",
  })
  @ApiResponse({
    status: 200,
    description: "List of activity logs retrieved successfully",
    type: PaginatedActivityLogsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getActivityLogs(
    @Query() query: AdminQueryActivityLogsDto,
  ): Promise<PaginatedActivityLogsResponseDto> {
    return this.activityLogsService.getActivityLogs(query);
  }

  @Get(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get activity log by ID (admin)",
    description:
      "Retrieve a single activity log by its ID. Admin-only endpoint.",
  })
  @ApiParam({
    name: "id",
    description: "Activity log ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Activity log retrieved successfully",
    type: ActivityLogResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Activity log not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getActivityLog(
    @Param("id") id: string,
  ): Promise<ActivityLogResponseDto> {
    return this.activityLogsService.getActivityLog(id);
  }

  @Get(":id/diff")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get activity log diff (admin)",
    description:
      "Retrieve the before/after diff for a specific activity log. Admin-only endpoint.",
  })
  @ApiParam({
    name: "id",
    description: "Activity log ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Activity log diff retrieved successfully",
    schema: {
      type: "object",
      properties: {
        before: {
          type: "object",
          nullable: true,
          description: "State before the change",
        },
        after: {
          type: "object",
          nullable: true,
          description: "State after the change",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Activity log not found or no diff available",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getActivityLogDiff(@Param("id") id: string): Promise<{
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  }> {
    return this.activityLogsService.getActivityLogDiff(id);
  }
}
