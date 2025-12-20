import { Body, Controller, Get, Headers, Put, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { StoreResponseDto, UpdateStoreDto } from "./dto/stores.dto";
import { StoresService } from "./stores.service";

@ApiTags("admin")
@Controller("admin/store")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin", "support", "reviewer", "marketing")
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get store metadata (admin)",
    description:
      "Retrieve the current/default store metadata. For future multi-store support, use x-store-id header.",
  })
  @ApiHeader({
    name: "x-store-id",
    required: false,
    description: "Store ID (for future multi-store support, currently ignored)",
  })
  @ApiResponse({
    status: 200,
    description: "Store metadata retrieved successfully",
    type: StoreResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getStore(
    @Headers("x-store-id") storeId?: string,
  ): Promise<StoreResponseDto> {
    // Extract store ID from header (for future use)
    this.storesService.getStoreFromHeader(storeId);
    // Currently return default store
    return this.storesService.getStore();
  }

  @Put()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Update store metadata (admin)",
    description: "Update the current/default store metadata.",
  })
  @ApiHeader({
    name: "x-store-id",
    required: false,
    description: "Store ID (for future multi-store support, currently ignored)",
  })
  @ApiResponse({
    status: 200,
    description: "Store metadata updated successfully",
    type: StoreResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async updateStore(
    @Headers("x-store-id") storeId: string | undefined,
    @Body() dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    // Extract store ID from header (for future use)
    this.storesService.getStoreFromHeader(storeId);
    // Currently update default store
    return this.storesService.updateStore(dto);
  }
}
