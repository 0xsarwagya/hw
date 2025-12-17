import * as crypto from "node:crypto";
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { db, eq, orders, payments } from "@vcecom/db";
import Razorpay from "razorpay";
import { OrdersService } from "../orders/orders.service";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import {
  PaymentIntent,
  PaymentIntentStatus,
} from "../redis-store/dto/payment-intent.dto";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import {
  CreateRazorpayOrderDto,
  RazorpayOrderResponseDto,
} from "./dto/create-razorpay-order.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";
import { RazorpayWebhookEventDto } from "./dto/webhook-event.dto";
import { RazorpayConfigService } from "./razorpay-config.service";

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay | null = null;

  constructor(
    private readonly razorpayConfigService: RazorpayConfigService,
    private readonly checkoutStore: CheckoutStore,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Initialize Razorpay on module initialization
   * Reads configuration from environment variables
   */
  onModuleInit() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      this.razorpay = this.razorpayConfigService.initialize({
        keyId,
        keySecret,
      });
    }
  }

  /**
   * Get Razorpay instance
   * @returns Razorpay instance
   * @throws Error if Razorpay is not initialized
   */
  getRazorpayInstance(): Razorpay {
    if (!this.razorpay) {
      throw new Error(
        "Razorpay is not initialized. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.",
      );
    }
    return this.razorpay;
  }

  /**
   * Check if Razorpay is initialized
   * @returns true if Razorpay is initialized
   */
  isInitialized(): boolean {
    return this.razorpay !== null;
  }

  /**
   * Initialize Razorpay with custom configuration
   * @param keyId - Razorpay Key ID
   * @param keySecret - Razorpay Key Secret
   */
  initialize(keyId: string, keySecret: string): void {
    this.razorpay = this.razorpayConfigService.initialize({
      keyId,
      keySecret,
    });
  }

  /**
   * Create payment intent idempotently for a checkout session
   * Ensures exactly one payment intent per checkout session
   * @param checkoutSessionId - Checkout session ID
   * @param amount - Amount in paise
   * @param currency - Currency code (default: INR)
   * @param receipt - Receipt ID (optional)
   * @param notes - Additional notes (optional)
   * @returns Payment intent
   */
  async createPaymentIntent(
    checkoutSessionId: string,
    amount: number,
    currency: string = "INR",
    receipt?: string,
    notes?: Record<string, string>,
  ): Promise<PaymentIntent> {
    // Assert checkout state is LOCKED before creating payment intent
    await this.checkoutStore.assertState(
      checkoutSessionId,
      CheckoutState.LOCKED,
    );

    // Create or get payment intent atomically
    const paymentIntent = await this.checkoutStore.createOrGetPaymentIntent(
      checkoutSessionId,
      async () => {
        // This function is called only if payment intent doesn't exist
        const razorpay = this.getRazorpayInstance();

        // Prepare Razorpay order options
        const options = {
          amount,
          currency,
          receipt: receipt || `checkout-${checkoutSessionId}`,
          payment_capture: 1, // Auto-capture by default
          notes: {
            checkout_session_id: checkoutSessionId,
            ...notes,
          },
        };

        try {
          // Create order in Razorpay
          const razorpayOrder = await razorpay.orders.create(options);

          // Return payment intent
          const intent: PaymentIntent = {
            paymentProvider: "razorpay",
            paymentIntentId: razorpayOrder.id,
            status: PaymentIntentStatus.CREATED,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return intent;
        } catch (error) {
          throw new BadRequestException(
            `Failed to create Razorpay order: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      },
    );

    // Transition checkout state to PAYMENT_PENDING after successful creation
    try {
      await this.checkoutStore.transitionState(
        checkoutSessionId,
        CheckoutState.LOCKED,
        CheckoutState.PAYMENT_PENDING,
      );
    } catch (error) {
      // Log but don't fail - state transition failure shouldn't break payment intent creation
      // The payment intent is already created and stored
      this.logger.error(
        `Failed to transition checkout state to PAYMENT_PENDING for session ${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return paymentIntent;
  }

  /**
   * Create Razorpay order for payment (legacy method - for backward compatibility)
   * @param createRazorpayOrderDto - Order creation data
   * @returns Razorpay order response
   * @deprecated Use createPaymentIntent with checkoutSessionId instead
   */
  async createRazorpayOrder(
    createRazorpayOrderDto: CreateRazorpayOrderDto,
  ): Promise<RazorpayOrderResponseDto> {
    const razorpay = this.getRazorpayInstance();

    // Verify order exists in our system
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, createRazorpayOrderDto.orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createRazorpayOrderDto.orderId} not found`,
      );
    }

    // Check if order already has a Razorpay order ID
    if (order.razorpayOrderId) {
      throw new BadRequestException(
        `Order ${order.orderNumber} already has a Razorpay order ID: ${order.razorpayOrderId}`,
      );
    }

    // Prepare Razorpay order options
    const options = {
      amount: createRazorpayOrderDto.amount, // Amount in paise
      currency: createRazorpayOrderDto.currency || "INR",
      receipt: createRazorpayOrderDto.receipt || order.orderNumber,
      payment_capture: createRazorpayOrderDto.paymentCapture ?? 1, // Auto-capture by default
      notes: {
        order_id: order.id,
        order_number: order.orderNumber,
        ...createRazorpayOrderDto.notes,
      },
    };

    try {
      // Create order in Razorpay
      const razorpayOrder = await razorpay.orders.create(options);

      // Update our order with Razorpay order ID
      await db
        .update(orders)
        .set({
          razorpayOrderId: razorpayOrder.id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      // Update checkout session with payment intent and transition state
      // Note: In the current flow, order is created before payment intent.
      // The session may be in ORDER_CREATED state. For now, we'll handle
      // payment states separately. Ideally, payment should happen before order creation.
      try {
        const sessionData = await this.checkoutStore.getSessionByOrderId(
          order.id,
        );
        if (sessionData) {
          const { sessionId, session } = sessionData;
          await this.checkoutStore.setPaymentIntent(
            sessionId,
            razorpayOrder.id,
          );
          // Only transition if in a state that allows PAYMENT_PENDING
          // Note: Current flow creates order first, so session may already be ORDER_CREATED
          // In ideal flow, payment happens before order creation
          if (session.state === CheckoutState.LOCKED) {
            await this.checkoutStore.transitionState(
              sessionId,
              CheckoutState.LOCKED,
              CheckoutState.PAYMENT_PENDING,
            );
          }
        }
      } catch (error) {
        // Log but don't fail payment creation if state update fails
        console.error(
          "Failed to update checkout session with payment intent:",
          error,
        );
      }

      return razorpayOrder as RazorpayOrderResponseDto;
    } catch (error) {
      throw new BadRequestException(
        `Failed to create Razorpay order: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Verify payment signature
   * @param verifyPaymentDto - Payment verification data
   * @returns Verification result
   */
  async verifyPayment(
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<{ verified: boolean; message: string }> {
    this.getRazorpayInstance(); // Ensure Razorpay is initialized
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new BadRequestException("Razorpay key secret is not configured");
    }

    // Generate signature
    const text =
      verifyPaymentDto.razorpay_order_id +
      "|" +
      verifyPaymentDto.razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    // Compare signatures
    const isValid = generatedSignature === verifyPaymentDto.razorpay_signature;

    return {
      verified: isValid,
      message: isValid
        ? "Payment signature verified successfully"
        : "Payment signature verification failed",
    };
  }

  /**
   * Get Razorpay payment details
   * @param paymentId - Razorpay payment ID
   * @returns Payment details
   */
  async getPaymentDetails(paymentId: string) {
    const razorpay = this.getRazorpayInstance();

    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      throw new NotFoundException(
        `Payment with ID ${paymentId} not found: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Razorpay order details
   * @param orderId - Razorpay order ID
   * @returns Order details
   */
  async getRazorpayOrderDetails(orderId: string) {
    const razorpay = this.getRazorpayInstance();

    try {
      const razorpayOrder = await razorpay.orders.fetch(orderId);
      return razorpayOrder;
    } catch (error) {
      throw new NotFoundException(
        `Razorpay order with ID ${orderId} not found: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Handle Razorpay webhook event
   * @param webhookEvent - Webhook event from Razorpay
   * @param signature - Webhook signature for verification
   * @returns Processing result
   */
  async handleWebhook(
    webhookEvent: RazorpayWebhookEventDto,
    signature: string,
  ): Promise<{ processed: boolean; message: string }> {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new BadRequestException(
        "Razorpay webhook secret is not configured",
      );
    }

    // Verify webhook signature
    const text = JSON.stringify(webhookEvent);
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(text)
      .digest("hex");

    if (generatedSignature !== signature) {
      throw new BadRequestException("Invalid webhook signature");
    }

    // Process webhook event based on event type
    const eventName = webhookEvent.event;

    switch (eventName) {
      case "payment.captured":
        await this.handlePaymentCaptured(webhookEvent);
        break;
      case "payment.failed":
        await this.handlePaymentFailed(webhookEvent);
        break;
      case "payment.authorized":
        await this.handlePaymentAuthorized(webhookEvent);
        break;
      case "order.paid":
        await this.handleOrderPaid(webhookEvent);
        break;
      default:
        // Log unhandled events but don't fail
        return {
          processed: false,
          message: `Event ${eventName} is not handled`,
        };
    }

    return {
      processed: true,
      message: `Event ${eventName} processed successfully`,
    };
  }

  /**
   * Handle payment captured event
   * Creates order only after payment confirmation (webhook-driven)
   */
  private async handlePaymentCaptured(
    webhookEvent: RazorpayWebhookEventDto,
  ): Promise<void> {
    const paymentEntity = webhookEvent.payload.payment?.entity;
    if (!paymentEntity) {
      this.logger.warn("Payment entity not found in payment.captured webhook");
      return;
    }

    const paymentIntentId = paymentEntity.order_id; // Razorpay order ID

    // Find checkout session via payment intent lookup
    let checkoutSessionId: string | null = null;

    // Method 1: Try to get checkoutSessionId from Razorpay order notes
    try {
      const razorpayOrder = await this.getRazorpayOrderDetails(paymentIntentId);
      const sessionIdFromNotes = razorpayOrder.notes?.checkout_session_id;
      checkoutSessionId =
        typeof sessionIdFromNotes === "string" ? sessionIdFromNotes : null;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch Razorpay order details for paymentIntentId=${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Method 2: Fallback to reverse lookup if not in notes
    if (!checkoutSessionId) {
      try {
        const paymentIntent =
          await this.checkoutStore.getPaymentIntentByPaymentId(paymentIntentId);
        if (paymentIntent) {
          // Extract checkoutSessionId from payment intent (we need to get it from the key)
          // Since we don't store checkoutSessionId in PaymentIntent, use reverse lookup
          const reverseKey = `payment:intent:by-id:${paymentIntentId}`;
          checkoutSessionId = await this.checkoutStore.get<string>(reverseKey);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to get checkoutSessionId via reverse lookup for paymentIntentId=${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // If we still don't have checkoutSessionId, check if order already exists (legacy flow)
    if (!checkoutSessionId) {
      const existingOrderId = await this.checkoutStore.getOrderByPaymentIntent(
        "razorpay",
        paymentIntentId,
      );
      if (existingOrderId) {
        // Order already exists - this is a duplicate webhook or legacy order
        this.logger.debug(
          `Order already exists for paymentIntentId=${paymentIntentId}, orderId=${existingOrderId}. Processing payment record only.`,
        );
        await this.createPaymentRecord(paymentEntity, existingOrderId);
        return;
      }
    }

    if (!checkoutSessionId) {
      this.logger.error(
        `Checkout session ID not found for payment.captured webhook (paymentIntentId: ${paymentIntentId}). Cannot create order.`,
      );
      return;
    }

    // Get checkout session to check state (late event handling)
    const session = await this.checkoutStore.getSession(checkoutSessionId);
    if (!session) {
      this.logger.error(
        `Checkout session ${checkoutSessionId} not found for paymentIntentId=${paymentIntentId}`,
      );
      return;
    }

    // Late event handling: ignore if checkout is already COMPLETED
    if (session.state === CheckoutState.COMPLETED) {
      this.logger.log(
        `Ignoring late payment.captured webhook for completed checkout: checkoutSessionId=${checkoutSessionId}, paymentIntentId=${paymentIntentId}`,
      );
      // Still create payment record if order exists
      const existingOrderId = await this.checkoutStore.getOrderByPaymentIntent(
        "razorpay",
        paymentIntentId,
      );
      if (existingOrderId) {
        await this.createPaymentRecord(paymentEntity, existingOrderId);
      }
      return;
    }

    // Ignore if checkout is FAILED
    if (session.state === CheckoutState.FAILED) {
      this.logger.log(
        `Ignoring payment.captured webhook for failed checkout: checkoutSessionId=${checkoutSessionId}, paymentIntentId=${paymentIntentId}`,
      );
      return;
    }

    // Update payment intent status and transition to PAYMENT_CONFIRMED
    try {
      await this.checkoutStore.updatePaymentIntentStatus(
        checkoutSessionId,
        PaymentIntentStatus.CONFIRMED,
      );

      // Transition checkout session to PAYMENT_CONFIRMED
      if (session.state === CheckoutState.PAYMENT_PENDING) {
        try {
          await this.checkoutStore.transitionState(
            checkoutSessionId,
            CheckoutState.PAYMENT_PENDING,
            CheckoutState.PAYMENT_CONFIRMED,
          );
        } catch (error) {
          this.logger.error(
            `Failed to transition checkout session to PAYMENT_CONFIRMED: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          // Continue - will retry state transition in finalizeOrderFromPayment
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to update payment intent status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Continue - payment is confirmed, we can still create order
    }

    // Acquire checkout lock before order creation (prevents concurrent webhook processing)
    const lockAcquired = await this.checkoutStore.acquireCheckoutLock(
      session.cartId,
    );
    if (!lockAcquired) {
      // Lock already held - another webhook worker is processing
      // Check if order was created by the other worker
      const existingOrderId = await this.checkoutStore.getOrderByPaymentIntent(
        "razorpay",
        paymentIntentId,
      );
      if (existingOrderId) {
        this.logger.debug(
          `Order already being created by another worker for paymentIntentId=${paymentIntentId}, orderId=${existingOrderId}`,
        );
        await this.createPaymentRecord(paymentEntity, existingOrderId);
        return;
      }
      // Lock held but no order - wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, 200));
      const retryOrderId = await this.checkoutStore.getOrderByPaymentIntent(
        "razorpay",
        paymentIntentId,
      );
      if (retryOrderId) {
        await this.createPaymentRecord(paymentEntity, retryOrderId);
        return;
      }
      this.logger.warn(
        `Checkout lock held but order not found for paymentIntentId=${paymentIntentId}. Another worker may be processing.`,
      );
      return;
    }

    try {
      // Create order from payment confirmation (webhook-driven)
      const order = await this.ordersService.finalizeOrderFromPayment(
        checkoutSessionId,
        paymentIntentId,
        "razorpay",
      );

      // Create payment record
      await this.createPaymentRecord(paymentEntity, order.id);

      this.logger.log(
        `Order created from payment confirmation: orderId=${order.id}, paymentIntentId=${paymentIntentId}, checkoutSessionId=${checkoutSessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to finalize order from payment: paymentIntentId=${paymentIntentId}, checkoutSessionId=${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    } finally {
      // Release checkout lock
      try {
        await this.checkoutStore.releaseCheckoutLock(session.cartId);
      } catch (error) {
        this.logger.error(
          `Failed to release checkout lock: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }

  /**
   * Create or update payment record (idempotent)
   */
  private async createPaymentRecord(
    paymentEntity: {
      id: string;
      order_id: string;
      amount: number;
      method: string;
    },
    orderId: string,
  ): Promise<void> {
    // Check if payment already exists (idempotent webhook processing)
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, paymentEntity.id))
      .limit(1);

    if (existingPayment) {
      // Update existing payment (idempotent)
      await db
        .update(payments)
        .set({
          status: "captured",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, existingPayment.id));
    } else {
      // Create new payment record
      await db.insert(payments).values({
        orderId,
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id,
        amount: paymentEntity.amount / 100, // Convert from paise to rupees
        status: "captured",
        method: this.mapRazorpayMethodToEnum(paymentEntity.method),
      });
    }

    // Update order status to confirmed if payment is captured
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order && order.status === "pending") {
      await db
        .update(orders)
        .set({
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    }
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(
    webhookEvent: RazorpayWebhookEventDto,
  ): Promise<void> {
    const paymentEntity = webhookEvent.payload.payment?.entity;
    if (!paymentEntity) {
      return;
    }

    const paymentIntentId = paymentEntity.order_id; // Razorpay order ID

    // Find checkout session via payment intent lookup
    let checkoutSessionId: string | null = null;

    // Method 1: Try to get checkoutSessionId from Razorpay order notes
    try {
      const razorpayOrder = await this.getRazorpayOrderDetails(paymentIntentId);
      const sessionIdFromNotes = razorpayOrder.notes?.checkout_session_id;
      checkoutSessionId =
        typeof sessionIdFromNotes === "string" ? sessionIdFromNotes : null;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch Razorpay order details for paymentIntentId=${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Method 2: Fallback to reverse lookup if not in notes
    if (!checkoutSessionId) {
      try {
        const reverseKey = `payment:intent:by-id:${paymentIntentId}`;
        checkoutSessionId = await this.checkoutStore.get<string>(reverseKey);
      } catch (error) {
        this.logger.warn(
          `Failed to get checkoutSessionId via reverse lookup for paymentIntentId=${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Update payment intent status if we found checkoutSessionId
    if (checkoutSessionId) {
      try {
        const paymentIntent =
          await this.checkoutStore.getPaymentIntent(checkoutSessionId);
        if (paymentIntent) {
          // Update payment intent status atomically (idempotent)
          await this.checkoutStore.updatePaymentIntentStatus(
            checkoutSessionId,
            PaymentIntentStatus.FAILED,
          );

          // Transition checkout session to FAILED if in PAYMENT_PENDING
          try {
            const session =
              await this.checkoutStore.getSession(checkoutSessionId);
            if (session && session.state === CheckoutState.PAYMENT_PENDING) {
              await this.checkoutStore.failSession(checkoutSessionId);
            }
          } catch (error) {
            this.logger.error(
              `Failed to fail checkout session: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to update payment intent status: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Find order by Razorpay order ID
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, paymentIntentId))
      .limit(1);

    if (!order) {
      // Order not found, but payment intent was updated
      return;
    }

    // Transition checkout session to FAILED (legacy fallback)
    try {
      const sessionData = await this.checkoutStore.getSessionByOrderId(
        order.id,
      );
      if (sessionData && !checkoutSessionId) {
        // Only use legacy flow if we didn't already update via payment intent
        await this.checkoutStore.failSession(sessionData.sessionId);
      }
    } catch (error) {
      // Log but don't fail webhook processing if state transition fails
      this.logger.error(
        `Failed to transition checkout session to FAILED: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Check if payment exists
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, paymentEntity.id))
      .limit(1);

    if (existingPayment) {
      // Update payment status
      await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, existingPayment.id));
    } else {
      // Create payment record with failed status
      await db.insert(payments).values({
        orderId: order.id,
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id,
        amount: paymentEntity.amount / 100,
        status: "failed",
        method: this.mapRazorpayMethodToEnum(paymentEntity.method),
      });
    }
  }

  /**
   * Handle payment authorized event
   */
  private async handlePaymentAuthorized(
    webhookEvent: RazorpayWebhookEventDto,
  ): Promise<void> {
    const paymentEntity = webhookEvent.payload.payment?.entity;
    if (!paymentEntity) {
      return;
    }

    // Find order by Razorpay order ID
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, paymentEntity.order_id))
      .limit(1);

    if (!order) {
      return;
    }

    // Create or update payment record with processing status
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, paymentEntity.id))
      .limit(1);

    if (existingPayment) {
      await db
        .update(payments)
        .set({
          status: "processing",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, existingPayment.id));
    } else {
      await db.insert(payments).values({
        orderId: order.id,
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id,
        amount: paymentEntity.amount / 100,
        status: "processing",
        method: this.mapRazorpayMethodToEnum(paymentEntity.method),
      });
    }
  }

  /**
   * Handle order paid event
   */
  private async handleOrderPaid(
    webhookEvent: RazorpayWebhookEventDto,
  ): Promise<void> {
    const orderEntity = webhookEvent.payload.order?.entity;
    if (!orderEntity) {
      return;
    }

    // Find order by Razorpay order ID
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, orderEntity.id))
      .limit(1);

    if (!order) {
      return;
    }

    // Update order status to confirmed
    if (order.status === "pending") {
      await db
        .update(orders)
        .set({
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
    }
  }

  /**
   * Map Razorpay payment method to our enum
   */
  private mapRazorpayMethodToEnum(
    razorpayMethod: string,
  ): "razorpay" | "cod" | "upi" | "card" | "netbanking" | "wallet" {
    const methodMap: Record<
      string,
      "razorpay" | "cod" | "upi" | "card" | "netbanking" | "wallet"
    > = {
      card: "card",
      upi: "upi",
      netbanking: "netbanking",
      wallet: "wallet",
      cod: "cod",
    };

    return methodMap[razorpayMethod.toLowerCase()] || "razorpay";
  }
}
