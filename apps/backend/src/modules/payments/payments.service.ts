import * as crypto from "node:crypto";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { db, eq, orders, payments } from "@vcecom/db";
import Razorpay from "razorpay";
import {
  CreateRazorpayOrderDto,
  RazorpayOrderResponseDto,
} from "./dto/create-razorpay-order.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";
import { RazorpayWebhookEventDto } from "./dto/webhook-event.dto";
import { RazorpayConfigService } from "./razorpay-config.service";

@Injectable()
export class PaymentsService implements OnModuleInit {
  private razorpay: Razorpay | null = null;

  constructor(private readonly razorpayConfigService: RazorpayConfigService) {}

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
   * Create Razorpay order for payment
   * @param createRazorpayOrderDto - Order creation data
   * @returns Razorpay order response
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
   */
  private async handlePaymentCaptured(
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
      return; // Order not found, skip processing
    }

    // Check if payment already exists
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, paymentEntity.id))
      .limit(1);

    if (existingPayment) {
      // Update existing payment
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
        orderId: order.id,
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id,
        amount: paymentEntity.amount / 100, // Convert from paise to rupees
        status: "captured",
        method: this.mapRazorpayMethodToEnum(paymentEntity.method),
      });
    }

    // Update order status to confirmed if payment is captured
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
   * Handle payment failed event
   */
  private async handlePaymentFailed(
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
