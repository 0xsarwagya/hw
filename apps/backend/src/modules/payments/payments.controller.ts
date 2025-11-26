import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

interface RequestWithRawBody extends Request {
  rawBody?: Buffer | string;
}

import {
  CreateRazorpayOrderDto,
  RazorpayOrderResponseDto,
} from "./dto/create-razorpay-order.dto";
import { RazorpayConfigDto } from "./dto/razorpay-config.dto";
import {
  PaymentVerificationResponseDto,
  VerifyPaymentDto,
} from "./dto/verify-payment.dto";
import { RazorpayWebhookEventDto } from "./dto/webhook-event.dto";
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
    summary: "Initialize Razorpay with API credentials",
    description:
      "Initializes Razorpay with the provided API credentials. Only accessible by admin users. This endpoint allows manual initialization of Razorpay if environment variables are not set.",
  })
  @ApiResponse({
    status: 201,
    description: "Razorpay initialized successfully",
    schema: {
      type: "object",
      properties: {
        initialized: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example: "Razorpay initialized successfully",
        },
      },
    },
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
  initializeRazorpay(@Body() configDto: RazorpayConfigDto) {
    this.paymentsService.initialize(configDto.keyId, configDto.keySecret);
    return {
      initialized: true,
      message: "Razorpay initialized successfully",
    };
  }

  @Post("razorpay/orders")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Create a Razorpay order",
    description:
      "Creates a Razorpay order for payment processing. Requires an existing order in the system. Accessible by admin and customer users.",
  })
  @ApiResponse({
    status: 201,
    description: "Razorpay order created successfully",
    type: RazorpayOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request - Invalid order data or order already has Razorpay order ID",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async createRazorpayOrder(
    @Body() createRazorpayOrderDto: CreateRazorpayOrderDto,
  ): Promise<RazorpayOrderResponseDto> {
    return this.paymentsService.createRazorpayOrder(createRazorpayOrderDto);
  }

  @Post("razorpay/verify")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Verify Razorpay payment signature",
    description:
      "Verifies the signature of a Razorpay payment to ensure authenticity. Accessible by admin and customer users.",
  })
  @ApiResponse({
    status: 200,
    description: "Payment verification result",
    type: PaymentVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid signature or payment data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden",
  })
  async verifyPayment(
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ): Promise<PaymentVerificationResponseDto> {
    return this.paymentsService.verifyPayment(verifyPaymentDto);
  }

  @Get("razorpay/payments/:paymentId")
  @Roles("admin")
  @ApiOperation({
    summary: "Get Razorpay payment details",
    description:
      "Retrieves payment details from Razorpay API. Only accessible by admin users.",
  })
  @ApiResponse({
    status: 200,
    description: "Payment details",
    schema: {
      type: "object",
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
  @ApiResponse({
    status: 404,
    description: "Payment not found",
  })
  async getPaymentDetails(@Param("paymentId") paymentId: string) {
    return this.paymentsService.getPaymentDetails(paymentId);
  }

  @Get("razorpay/orders/:orderId")
  @Roles("admin")
  @ApiOperation({
    summary: "Get Razorpay order details",
    description:
      "Retrieves order details from Razorpay API. Only accessible by admin users.",
  })
  @ApiResponse({
    status: 200,
    description: "Razorpay order details",
    schema: {
      type: "object",
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
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async getRazorpayOrderDetails(@Param("orderId") orderId: string) {
    return this.paymentsService.getRazorpayOrderDetails(orderId);
  }

  @Post("razorpay/webhook")
  @SetMetadata(IS_PUBLIC_KEY, true)
  @ApiOperation({
    summary: "Handle Razorpay webhook events",
    description:
      "Receives and processes webhook events from Razorpay. This endpoint is public (no authentication required) but is secured by webhook signature verification.",
  })
  @ApiHeader({
    name: "x-razorpay-signature",
    description: "Razorpay webhook signature for verification",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Webhook processed successfully",
    schema: {
      type: "object",
      properties: {
        processed: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example: "Event payment.captured processed successfully",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid signature or webhook data",
  })
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers("x-razorpay-signature") signature: string,
  ): Promise<{ processed: boolean; message: string }> {
    if (!signature) {
      throw new Error("Razorpay signature header is required");
    }

    // Parse webhook event from raw body or body
    let webhookEvent: RazorpayWebhookEventDto;
    if (req.rawBody) {
      webhookEvent =
        req.rawBody instanceof Buffer
          ? JSON.parse(req.rawBody.toString())
          : JSON.parse(req.rawBody as string);
    } else if (req.body) {
      webhookEvent =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : (req.body as RazorpayWebhookEventDto);
    } else {
      throw new Error("Webhook body is required");
    }

    return this.paymentsService.handleWebhook(webhookEvent, signature);
  }
}
