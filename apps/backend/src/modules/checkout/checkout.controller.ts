import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Request,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { CartsService } from "../carts/carts.service";
import { PaymentFeeBreakdownDto } from "../payments/dto/payment-charge.dto";
import { PaymentChargeService } from "../payments/services/payment-charge.service";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import {
  PaymentMethodWithFeeDto,
  SelectPaymentMethodDto,
} from "./dto/checkout.dto";

@ApiTags("store")
@Controller("store/checkout")
@Public()
export class CheckoutController {
  constructor(
    private readonly cartsService: CartsService,
    private readonly paymentChargeService: PaymentChargeService,
    private readonly checkoutStore: CheckoutStore,
  ) {}

  @Get("payment-methods")
  @RateLimit(RATE_LIMIT_PRESETS.STOREFRONT_GET)
  @ApiOperation({
    summary: "Get available payment methods with fees",
    description:
      "Returns all available payment methods with calculated fees based on current cart total. Supports both authenticated and guest checkout.",
  })
  @ApiHeader({
    name: "X-Session-Id",
    description: "Session ID for guest checkout (required for guest checkout)",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Payment methods retrieved successfully",
    type: [PaymentMethodWithFeeDto],
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (empty cart, etc.)",
  })
  async getPaymentMethods(
    @Request() req: Request & {
      user?: { userId: string; email: string; role: string };
    },
    @Headers("x-session-id") sessionId?: string,
    @Query("checkoutSessionId") checkoutSessionId?: string,
  ): Promise<{ methods: PaymentMethodWithFeeDto[] }> {
    const userId = req.user?.userId || null;

    // Get cart
    const cart = await this.cartsService.getCart(userId, sessionId || null);
    if (!cart || !cart.items || cart.items.length === 0) {
      // Return empty methods list instead of throwing error
      return { methods: [] };
    }

    // Calculate cart total in paise (convert from INR)
    const cartTotalInPaise = Math.round(cart.total * 100);

    // Convert cart items to format expected by payment charge service
    const cartItems = cart.items.map((item) => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      price: item.price,
      metadata: (item as { metadata?: unknown }).metadata,
    }));

    // Get available payment methods with fees
    const methods = await this.paymentChargeService.getAvailableMethods(
      cartTotalInPaise,
      "INR", // TODO: Get currency from cart/store config
      cartItems,
    );

    return { methods };
  }

  @Post("payment")
  @RateLimit(RATE_LIMIT_PRESETS.PAYMENT_INTENT)
  @ApiOperation({
    summary: "Select payment method for checkout",
    description:
      "Selects a payment method and calculates the fee. Stores payment method and fee in checkout session for order creation.",
  })
  @ApiHeader({
    name: "X-Session-Id",
    description: "Session ID for guest checkout (required for guest checkout)",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Payment method selected successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (invalid method, cart empty, etc.)",
  })
  @ApiResponse({
    status: 404,
    description: "Checkout session not found",
  })
  async selectPaymentMethod(
    @Request() req: Request & {
      user?: { userId: string; email: string; role: string };
    },
    @Body() dto: SelectPaymentMethodDto,
    @Headers("x-session-id") sessionId?: string,
  ): Promise<{
    success: boolean;
    fee: number;
    breakdown: PaymentFeeBreakdownDto;
  }> {
    const userId = req.user?.userId || null;

    // Get cart
    const cart = await this.cartsService.getCart(userId, sessionId || null);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Calculate cart total in paise
    const cartTotalInPaise = Math.round(cart.total * 100);

    // Calculate fee for selected method
    const { fee, breakdown } = await this.paymentChargeService.calculateFee(
      dto.paymentMethod,
      cartTotalInPaise,
      "INR", // TODO: Get currency from cart/store config
    );

    // If checkout session exists, update it with payment method and fee
    if (dto.checkoutSessionId) {
      const session = await this.checkoutStore.getSession(
        dto.checkoutSessionId,
      );
      if (!session) {
        throw new BadRequestException(
          `Checkout session ${dto.checkoutSessionId} not found`,
        );
      }
      // Update checkout metadata with payment method and fee
      const metadata = await this.checkoutStore.getCheckoutMetadata(
        dto.checkoutSessionId,
      );
      if (!metadata) {
        throw new BadRequestException(
          `Checkout metadata for session ${dto.checkoutSessionId} not found`,
        );
      }
      await this.checkoutStore.storeCheckoutMetadata(dto.checkoutSessionId, {
        ...metadata,
        paymentMethod: dto.paymentMethod,
        paymentFee: fee,
        paymentFeeBreakdown: breakdown,
      });
    }

    return {
      success: true,
      fee,
      breakdown,
    };
  }
}
