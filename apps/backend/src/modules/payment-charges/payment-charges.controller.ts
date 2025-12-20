import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
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
  CreatePaymentChargeDto,
  PreviewFeeDto,
  UpdatePaymentChargeDto,
} from "./dto/payment-charges.dto";
import { PaymentChargesService } from "./payment-charges.service";

@ApiTags("admin")
@Controller("admin/payment-charges")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin", "marketing")
export class PaymentChargesController {
  constructor(private readonly paymentChargesService: PaymentChargesService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "List all payment method charges",
    description: "Returns all payment method charge configurations",
  })
  @ApiResponse({
    status: 200,
    description: "Payment charges retrieved successfully",
  })
  async list() {
    return this.paymentChargesService.findAll();
  }

  @Get(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get payment method charge by ID",
    description: "Returns a single payment method charge configuration",
  })
  @ApiResponse({
    status: 200,
    description: "Payment charge retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Payment charge not found",
  })
  async get(@Param("id") id: string) {
    return this.paymentChargesService.findOne(id);
  }

  @Post()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Create payment method charge",
    description: "Creates a new payment method charge configuration",
  })
  @ApiResponse({
    status: 201,
    description: "Payment charge created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request",
  })
  async create(@Body() dto: CreatePaymentChargeDto) {
    return this.paymentChargesService.create(dto);
  }

  @Patch(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Update payment method charge",
    description: "Updates an existing payment method charge configuration",
  })
  @ApiResponse({
    status: 200,
    description: "Payment charge updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Payment charge not found",
  })
  async update(@Param("id") id: string, @Body() dto: UpdatePaymentChargeDto) {
    return this.paymentChargesService.update(id, dto);
  }

  @Delete(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Delete payment method charge",
    description: "Deletes a payment method charge configuration",
  })
  @ApiResponse({
    status: 200,
    description: "Payment charge deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Payment charge not found",
  })
  async delete(@Param("id") id: string) {
    return this.paymentChargesService.remove(id);
  }

  @Post("preview")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Preview fee calculation",
    description: "Preview fee calculation for a given cart total",
  })
  @ApiResponse({
    status: 200,
    description: "Fee preview calculated successfully",
  })
  async preview(@Body() dto: PreviewFeeDto) {
    return this.paymentChargesService.previewFee(dto.chargeId, dto.cartTotal);
  }
}
