import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
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
import {
  CreateRazorpayOrderDto,
  RazorpayOrderResponseDto,
} from "./dto/create-razorpay-order.dto";
import {
  PaymentVerificationResponseDto,
  VerifyPaymentDto,
} from "./dto/verify-payment.dto";
import { RazorpayWebhookEventDto } from "./dto/webhook-event.dto";
import { PaymentsService } from "./payments.service";

@ApiTags("store")
@Controller("store/payments")
export class StorePaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("razorpay/orders")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "customer")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create Razorpay order for payment",
    description:
      "Creates a Razorpay order for an existing system order. This generates a payment order that can be used for Razorpay checkout.",
  })
  @ApiResponse({
    status: 201,
    description: "Razorpay order created successfully",
    type: RazorpayOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request (order already has Razorpay order, invalid amount, etc.)",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "customer")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Verify Razorpay payment signature",
    description:
      "Verifies the payment signature received from Razorpay after a successful payment. This ensures the payment is authentic and not tampered with.",
  })
  @ApiResponse({
    status: 200,
    description: "Payment verification result",
    type: PaymentVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request (invalid signature format, missing key secret, etc.)",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async verifyPayment(
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ): Promise<PaymentVerificationResponseDto> {
    return this.paymentsService.verifyPayment(verifyPaymentDto);
  }

  @Post("razorpay/webhook")
  @SetMetadata(IS_PUBLIC_KEY, true)
  @ApiOperation({
    summary: "Handle Razorpay webhook events",
    description:
      "Receives and processes webhook events from Razorpay. This endpoint should be configured in Razorpay dashboard. Webhook signature is verified for security.",
  })
  @ApiHeader({
    name: "x-razorpay-signature",
    description: "Razorpay webhook signature",
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
    description:
      "Bad request (invalid signature, missing webhook secret, etc.)",
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature: string,
  ): Promise<{ processed: boolean; message: string }> {
    if (!signature) {
      throw new BadRequestException("Missing x-razorpay-signature header");
    }

    // Parse body if it's a buffer or string
    let webhookEvent: RazorpayWebhookEventDto;
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      webhookEvent = JSON.parse(
        req.rawBody.toString(),
      ) as RazorpayWebhookEventDto;
    } else if (typeof req.body === "string") {
      webhookEvent = JSON.parse(req.body) as RazorpayWebhookEventDto;
    } else if (req.body && typeof req.body === "object") {
      webhookEvent = req.body as unknown as RazorpayWebhookEventDto;
    } else {
      throw new BadRequestException("Invalid webhook payload");
    }

    return this.paymentsService.handleWebhook(webhookEvent, signature);
  }
}
