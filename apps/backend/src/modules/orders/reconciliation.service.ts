import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { OrderResponseDto } from "./dto/order-response.dto";
import { OrdersService } from "./orders.service";

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly checkoutStore: CheckoutStore,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Reprocess payment intent to create order
   * Safe to call multiple times - idempotent
   * @param paymentIntentId - Payment intent ID from provider (e.g., Razorpay order ID)
   * @param provider - Payment provider (default: "razorpay")
   * @returns Order if created or found, null if payment not confirmed
   */
  async reprocessPaymentIntent(
    paymentIntentId: string,
    provider: string = "razorpay",
  ): Promise<OrderResponseDto | null> {
    this.logger.log(
      `Reprocessing payment intent: paymentIntentId=${paymentIntentId}, provider=${provider}`,
    );

    // Check if order already exists (idempotent)
    const existingOrderId = await this.checkoutStore.getOrderByPaymentIntent(
      provider,
      paymentIntentId,
    );

    if (existingOrderId) {
      this.logger.log(
        `Order already exists for paymentIntentId=${paymentIntentId}, orderId=${existingOrderId}`,
      );
      // Fetch and return existing order directly from database
      // (bypassing user check since this is admin reconciliation)
      const { db, eq, orders, orderItems } = await import("@vcecom/db");
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, existingOrderId))
        .limit(1);

      if (!order) {
        throw new NotFoundException(
          `Order ${existingOrderId} not found for payment intent ${paymentIntentId}`,
        );
      }

      // Get order items
      const orderItemsResult = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        items: orderItemsResult,
        gstBreakdown: {
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalGst: order.gstAmount,
          isIntraState: false,
        },
      } as OrderResponseDto;
    }

    // Find checkout session via payment intent
    let checkoutSessionId: string | null = null;

    // Try reverse lookup
    try {
      const reverseKey = `payment:intent:by-id:${paymentIntentId}`;
      checkoutSessionId = await this.checkoutStore.get<string>(reverseKey);
    } catch (error) {
      this.logger.warn(
        `Failed to get checkoutSessionId via reverse lookup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    if (!checkoutSessionId) {
      throw new NotFoundException(
        `Checkout session not found for payment intent ${paymentIntentId}`,
      );
    }

    // Get checkout session
    const session = await this.checkoutStore.getSession(checkoutSessionId);
    if (!session) {
      throw new NotFoundException(
        `Checkout session ${checkoutSessionId} not found`,
      );
    }

    // Check payment intent status
    const paymentIntent =
      await this.checkoutStore.getPaymentIntent(checkoutSessionId);
    if (!paymentIntent) {
      throw new NotFoundException(
        `Payment intent not found for checkout session ${checkoutSessionId}`,
      );
    }

    // Only proceed if payment is confirmed
    if (paymentIntent.status !== "CONFIRMED") {
      this.logger.warn(
        `Payment intent ${paymentIntentId} is not confirmed (status: ${paymentIntent.status}). Cannot create order.`,
      );
      return null;
    }

    // Validate checkout state
    if (
      session.state !== CheckoutState.PAYMENT_CONFIRMED &&
      session.state !== CheckoutState.PAYMENT_PENDING
    ) {
      if (session.state === CheckoutState.COMPLETED) {
        // Order should exist but doesn't - this is an inconsistency
        throw new BadRequestException(
          `Checkout session is COMPLETED but order not found. This indicates a data inconsistency.`,
        );
      }
      throw new BadRequestException(
        `Cannot create order: checkout session is in state ${session.state}, expected PAYMENT_CONFIRMED or PAYMENT_PENDING`,
      );
    }

    // Ensure state is PAYMENT_CONFIRMED
    if (session.state === CheckoutState.PAYMENT_PENDING) {
      try {
        await this.checkoutStore.transitionState(
          checkoutSessionId,
          CheckoutState.PAYMENT_PENDING,
          CheckoutState.PAYMENT_CONFIRMED,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to transition to PAYMENT_CONFIRMED: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        // Continue - payment is confirmed, we can still create order
      }
    }

    // Create order from payment (idempotent)
    try {
      const order = await this.ordersService.finalizeOrderFromPayment(
        checkoutSessionId,
        paymentIntentId,
        provider,
      );

      this.logger.log(
        `Successfully reprocessed payment intent: paymentIntentId=${paymentIntentId}, orderId=${order.id}`,
      );

      return order;
    } catch (error) {
      this.logger.error(
        `Failed to reprocess payment intent ${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
