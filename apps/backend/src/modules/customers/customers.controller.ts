import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Request as ExpressRequest } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { OrderStatus } from "../orders/dto/update-order-status.dto";
import { OrdersService } from "../orders/orders.service";
import { AddressesService } from "./addresses.service";
import { CustomersService } from "./customers.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ClaimAccountDto } from "./dto/claim-account.dto";
import { CustomerProfileDto } from "./dto/customer-profile.dto";
import { RegisterCustomerDto } from "./dto/register-customer.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags("store")
@Controller("store/customers")
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly ordersService: OrdersService,
    private readonly addressesService: AddressesService,
  ) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register a new customer",
    description:
      "Create a new customer account with email, password, name, and phone. Returns access token and refresh token.",
  })
  @ApiCreatedResponse({
    description: "Customer successfully registered",
    schema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        refresh_token: { type: "string" },
        customer: { $ref: "#/components/schemas/CustomerProfileDto" },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      "Invalid input, email/phone/GSTIN already exists, or invalid GSTIN format",
  })
  async register(@Body() registerDto: RegisterCustomerDto) {
    return this.customersService.register(registerDto);
  }

  @Get("me")
  @Roles("customer")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get current customer profile",
    description: "Get the profile of the currently authenticated customer",
  })
  @ApiOkResponse({
    description: "Customer profile retrieved successfully",
    type: CustomerProfileDto,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async getProfile(@Request() req): Promise<CustomerProfileDto> {
    return this.customersService.getProfile(req.user.id);
  }

  @Put("me")
  @Roles("customer")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update customer profile",
    description: "Update the profile of the currently authenticated customer",
  })
  @ApiOkResponse({
    description: "Customer profile updated successfully",
    type: CustomerProfileDto,
  })
  @ApiBadRequestResponse({
    description:
      "Invalid input, phone/GSTIN already exists, or invalid GSTIN format",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<CustomerProfileDto> {
    return this.customersService.updateProfile(req.user.id, updateDto);
  }

  @Post("change-password")
  @Roles("customer")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Change customer password",
    description: "Change the password of the currently authenticated customer",
  })
  @ApiOkResponse({
    description: "Password changed successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Password changed successfully",
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid input",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required or current password incorrect",
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.customersService.changePassword(req.user.id, changePasswordDto);
  }

  @Public()
  @Post("claim")
  @HttpCode(HttpStatus.OK)
  @RateLimit(RATE_LIMIT_PRESETS.CLAIM_ACCOUNT)
  @ApiOperation({
    summary: "Claim account for guest customer",
    description:
      "Convert a guest customer account to a regular account by setting a password. Requires email verification token.",
  })
  @ApiOkResponse({
    description: "Account claimed successfully",
    type: CustomerProfileDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid input, email not found, or customer is not a guest",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid verification token",
  })
  async claimAccount(@Body() claimAccountDto: ClaimAccountDto) {
    return this.customersService.claimAccount(
      claimAccountDto.email,
      claimAccountDto.token,
      claimAccountDto.newPassword,
    );
  }

  @Get("orders")
  @UseGuards(JwtAuthGuard)
  @Roles("customer")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get customer orders",
    description:
      "Returns all orders for the authenticated customer. Optionally filter by status.",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: OrderStatus,
    description: "Filter orders by status",
    example: "pending",
  })
  @ApiOkResponse({
    description: "List of orders",
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
  })
  async getOrders(
    @Request() req: AuthenticatedRequest,
    @Query("status") status?: OrderStatus,
  ) {
    return this.ordersService.findAll(req.user.id, status);
  }

  @Get("addresses")
  @UseGuards(JwtAuthGuard)
  @Roles("customer")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get customer addresses",
    description: "Get all addresses for the currently authenticated customer",
  })
  @ApiOkResponse({
    description: "List of addresses",
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
  })
  async getAddresses(@Request() req: AuthenticatedRequest) {
    return this.addressesService.findAll(req.user.id);
  }
}
