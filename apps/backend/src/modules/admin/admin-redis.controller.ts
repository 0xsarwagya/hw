import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import {
  RedisHealthResponseDto,
  RedisStatsResponseDto,
} from "./dto/redis-health.dto";
import { RedisHealthService } from "./services/redis-health.service";

@ApiTags("admin")
@Controller("admin/redis")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class AdminRedisController {
  constructor(private readonly redisHealthService: RedisHealthService) {}

  @Get("health")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get Redis health status",
    description:
      "Returns comprehensive Redis health check including connection, memory, clients, and keyspace statistics.",
  })
  @ApiResponse({
    status: 200,
    description: "Redis health status",
    type: RedisHealthResponseDto,
  })
  async getHealth(): Promise<RedisHealthResponseDto> {
    return this.redisHealthService.getHealth();
  }

  @Get("stats")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get detailed Redis statistics",
    description:
      "Returns detailed Redis statistics including INFO output, keyspace data, and key counts by pattern.",
  })
  @ApiResponse({
    status: 200,
    description: "Redis statistics",
    type: RedisStatsResponseDto,
  })
  async getStats(): Promise<RedisStatsResponseDto> {
    return this.redisHealthService.getStats();
  }

  @Get("keys")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get key statistics by pattern",
    description:
      "Returns key counts grouped by common patterns (inventory, checkout, cart, pricing, discount, session, job).",
  })
  @ApiResponse({
    status: 200,
    description: "Key statistics by pattern",
    schema: {
      type: "object",
      additionalProperties: { type: "number" },
    },
  })
  async getKeys() {
    const health = await this.redisHealthService.getHealth();
    return health.keyspace.byPattern;
  }
}
