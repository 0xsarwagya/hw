import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DiscountsService } from "./discounts.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { DiscountResponseDto } from "./dto/discount-response.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { ValidateDiscountDto } from "./dto/validate-discount.dto";

@ApiTags("admin/discounts")
@Controller("admin/discounts")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new discount code",
    description:
      "Create a new discount code with STANDARD or BUY_GET type. Admin-only endpoint.",
  })
  @ApiResponse({
    status: 201,
    description: "Discount created successfully",
    type: DiscountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid discount data or code already exists",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async create(
    @Body() createDiscountDto: CreateDiscountDto,
  ): Promise<DiscountResponseDto> {
    return this.discountsService.create(createDiscountDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all discount codes",
    description:
      "Retrieve a paginated list of all discount codes. Admin-only endpoint.",
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
    description: "Items per page (default: 10, max: 100)",
  })
  @ApiResponse({
    status: 200,
    description: "List of discounts retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.discountsService.findAll(page || 1, limit || 10);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get discount by ID",
    description:
      "Retrieve a specific discount code by ID. Admin-only endpoint.",
  })
  @ApiParam({
    name: "id",
    description: "Discount ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Discount retrieved successfully",
    type: DiscountResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Discount not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async findOne(@Param("id") id: string): Promise<DiscountResponseDto> {
    return this.discountsService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update discount code",
    description: "Update an existing discount code. Admin-only endpoint.",
  })
  @ApiParam({
    name: "id",
    description: "Discount ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Discount updated successfully",
    type: DiscountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid discount data",
  })
  @ApiResponse({
    status: 404,
    description: "Discount not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async update(
    @Param("id") id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ): Promise<DiscountResponseDto> {
    return this.discountsService.update(id, updateDiscountDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete discount code",
    description: "Delete a discount code. Admin-only endpoint.",
  })
  @ApiParam({
    name: "id",
    description: "Discount ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Discount deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Discount not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    return this.discountsService.remove(id);
  }
}

@ApiTags("discounts")
@Controller("discounts")
export class PublicDiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post("validate")
  @Public()
  @ApiOperation({
    summary: "Validate discount code",
    description:
      "Validate a discount code. Public endpoint for checking if a discount code is valid before applying.",
  })
  @ApiResponse({
    status: 200,
    description: "Discount validation result",
  })
  @ApiResponse({
    status: 404,
    description: "Discount code not found",
  })
  async validateDiscount(
    @Request() req,
    @Body() validateDto: ValidateDiscountDto,
  ) {
    const userId = req.user?.id;
    return this.discountsService.validateDiscount(
      validateDto.code,
      userId,
      validateDto.orderAmount,
    );
  }
}
