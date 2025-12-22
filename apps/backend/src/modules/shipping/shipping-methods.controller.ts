import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import {
  CreateShippingMethodDto,
  ShippingMethodResponseDto,
  UpdateShippingMethodDto,
} from "./dto/shipping-methods.dto";
import { ShippingMethodsService } from "./shipping-methods.service";

@ApiTags("admin")
@Controller("admin/shipping-methods")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class ShippingMethodsController {
  constructor(
    private readonly shippingMethodsService: ShippingMethodsService,
  ) {}

  @Post()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Create a new shipping method",
    description:
      "Creates a new shipping method with the provided configuration",
  })
  @ApiResponse({
    status: 201,
    description: "Shipping method created successfully",
    type: ShippingMethodResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (duplicate code, invalid data)",
  })
  async create(@Body() dto: CreateShippingMethodDto) {
    return await this.shippingMethodsService.create(dto);
  }

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get all shipping methods",
    description:
      "Returns all shipping methods, optionally including inactive ones",
  })
  @ApiQuery({
    name: "includeInactive",
    description: "Include inactive shipping methods",
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: "Shipping methods retrieved successfully",
    type: [ShippingMethodResponseDto],
  })
  async findAll(@Query("includeInactive") includeInactive?: string) {
    const include = includeInactive === "true";
    return await this.shippingMethodsService.findAll(include);
  }

  @Get(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get shipping method by ID",
    description: "Returns a single shipping method by its ID",
  })
  @ApiParam({
    name: "id",
    description: "Shipping method ID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Shipping method retrieved successfully",
    type: ShippingMethodResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Shipping method not found",
  })
  async findOne(@Param("id") id: string) {
    return await this.shippingMethodsService.findOne(id);
  }

  @Put(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Update shipping method",
    description: "Updates an existing shipping method",
  })
  @ApiParam({
    name: "id",
    description: "Shipping method ID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Shipping method updated successfully",
    type: ShippingMethodResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Shipping method not found",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (duplicate code, invalid data)",
  })
  async update(@Param("id") id: string, @Body() dto: UpdateShippingMethodDto) {
    return await this.shippingMethodsService.update(id, dto);
  }

  @Delete(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Delete shipping method",
    description: "Deletes a shipping method by ID",
  })
  @ApiParam({
    name: "id",
    description: "Shipping method ID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Shipping method deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Shipping method not found",
  })
  async remove(@Param("id") id: string) {
    await this.shippingMethodsService.remove(id);
    return { message: "Shipping method deleted successfully" };
  }
}
