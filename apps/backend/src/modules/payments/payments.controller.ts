import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  RazorpayConfigDto,
  RazorpayConfigResponseDto,
} from "./dto/razorpay-config.dto";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("razorpay/status")
  @Roles("admin")
  @ApiOperation({
    summary: "Get Razorpay initialization status",
    description:
      "Returns the current initialization status of Razorpay. Only accessible by admin users.",
  })
  @ApiResponse({
    status: 200,
    description: "Razorpay initialization status",
    schema: {
      type: "object",
      properties: {
        initialized: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example: "Razorpay is initialized",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  getRazorpayStatus() {
    const isInitialized = this.paymentsService.isInitialized();
    return {
      initialized: isInitialized,
      message: isInitialized
        ? "Razorpay is initialized"
        : "Razorpay is not initialized",
    };
  }

  @Post("razorpay/initialize")
  @Roles("admin")
  @ApiOperation({
    summary: "Initialize Razorpay with API keys",
    description:
      "Initializes Razorpay with the provided API keys. Only accessible by admin users. This endpoint allows manual initialization of Razorpay if environment variables are not set.",
  })
  @ApiResponse({
    status: 201,
    description: "Razorpay initialized successfully",
    type: RazorpayConfigResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid configuration",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  initializeRazorpay(
    @Body() configDto: RazorpayConfigDto,
  ): RazorpayConfigResponseDto {
    this.paymentsService.initialize(configDto.keyId, configDto.keySecret);
    return {
      initialized: true,
      message: "Razorpay initialized successfully",
    };
  }
}
