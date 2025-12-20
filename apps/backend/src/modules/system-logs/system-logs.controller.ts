import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import {
  PaginatedSystemLogsResponseDto,
  QuerySystemLogsDto,
} from "./dto/system-logs.dto";
import { SystemLogsService } from "./system-logs.service";

@ApiTags("admin")
@Controller("admin/system-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin") // Only admins can view system logs
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get system logs (admin)",
    description:
      "Query system logs stored in Redis. Supports filtering by level, module, text search, and date range. Uses cursor-based pagination.",
  })
  @ApiQuery({
    name: "level",
    required: false,
    description: "Filter by log level (error, warn, info, debug)",
  })
  @ApiQuery({
    name: "from",
    required: false,
    description: "Start timestamp (ISO 8601)",
  })
  @ApiQuery({
    name: "to",
    required: false,
    description: "End timestamp (ISO 8601)",
  })
  @ApiQuery({
    name: "module",
    required: false,
    description: "Filter by module name",
  })
  @ApiQuery({
    name: "text",
    required: false,
    description: "Search text in message and context",
  })
  @ApiQuery({
    name: "cursor",
    required: false,
    description: "Cursor for pagination",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of results (default: 100)",
  })
  @ApiResponse({
    status: 200,
    description: "System logs retrieved successfully",
    type: PaginatedSystemLogsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getSystemLogs(
    @Query() query: QuerySystemLogsDto,
  ): Promise<PaginatedSystemLogsResponseDto> {
    return this.systemLogsService.getLogs(query);
  }
}
