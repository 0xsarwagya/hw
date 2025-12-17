import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  addresses,
  and,
  cartItems,
  customers,
  db,
  desc,
  eq,
  ilike,
  inArray,
  orderItems,
  orders,
  payments,
  products,
  productVariants,
  shipments,
} from "@vcecom/db";
import { calculateDiscount } from "../../common/utils/discount.utils";
import { calculateGstBreakdown } from "../../common/utils/gst.utils";
import { CartsService } from "../carts/carts.service";
import { DiscountsService } from "../discounts/discounts.service";
import { PaymentsService } from "../payments/payments.service";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import { CheckoutMetadata } from "../redis-store/dto/checkout-metadata.dto";
import { PaymentIntent } from "../redis-store/dto/payment-intent.dto";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { InventoryStore } from "../redis-store/stores/inventory-store";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import {
  OrderTimelineDto,
  TimelineEventDto,
  TimelineEventType,
} from "./dto/order-timeline.dto";
import { OrderTrackingDto } from "./dto/order-tracking.dto";
import { PaymentIntentResponseDto } from "./dto/payment-intent-response.dto";
import {
  OrderStatus,
  UpdateOrderStatusDto,
} from "./dto/update-order-status.dto";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly cartsService: CartsService,
    private readonly discountsService: DiscountsService,
    private readonly inventoryStore: InventoryStore,
    private readonly checkoutStore: CheckoutStore,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Generate unique order number
   * Format: ORD-YYYY-NNNNNN (e.g., ORD-2025-001234)
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    // Get the latest order number for this year
    const latestOrders = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(ilike(orders.orderNumber, `${prefix}%`))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    let sequence = 1;
    if (latestOrders.length > 0) {
      const latestNumber = latestOrders[0].orderNumber;
      const sequenceStr = latestNumber.replace(prefix, "");
      const parsedSequence = parseInt(sequenceStr, 10);
      if (!Number.isNaN(parsedSequence)) {
        sequence = parsedSequence + 1;
      }
    }

    // Format sequence as 6-digit number
    const formattedSequence = sequence.toString().padStart(6, "0");
    return `${prefix}${formattedSequence}`;
  }

  /**
   * Get customer ID from user ID
   */
  private async getCustomerId(userId: string): Promise<string> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (!customer) {
      throw new NotFoundException("Customer profile not found");
    }

    return customer.id;
  }

  /**
   * Get seller state (default to Maharashtra)
   */
  private getSellerState(): string {
    return process.env.SELLER_STATE || "Maharashtra";
  }

  /**
   * Validate that addresses belong to the customer
   */
  private async validateAddresses(
    customerId: string,
    shippingAddressId: string,
    billingAddressId: string,
  ) {
    // Check shipping address
    const [shippingAddress] = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, shippingAddressId),
          eq(addresses.customerId, customerId),
        ),
      )
      .limit(1);

    if (!shippingAddress) {
      throw new NotFoundException(
        "Shipping address not found or does not belong to customer",
      );
    }

    // Check billing address
    const [billingAddress] = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, billingAddressId),
          eq(addresses.customerId, customerId),
        ),
      )
      .limit(1);

    if (!billingAddress) {
      throw new NotFoundException(
        "Billing address not found or does not belong to customer",
      );
    }

    return { shippingAddress, billingAddress };
  }

  /**
   * Create payment intent for checkout
   * Orders are now created only after payment confirmation via webhook
   */
  async create(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<PaymentIntentResponseDto> {
    // Note: Idempotency is now handled at payment intent level (createOrGetPaymentIntent)
    // No need for request-level idempotency here since payment intent creation is idempotent
    let lockAcquired = false;
    let cartId: string | null = null;
    let checkoutSessionId: string | null = null;
    try {
      const customerId = await this.getCustomerId(userId);

      // Validate addresses first (before cart check to match test expectations)
      const { shippingAddress } = await this.validateAddresses(
        customerId,
        createOrderDto.shippingAddressId,
        createOrderDto.billingAddressId,
      );

      // Get customer cart after address validation
      const cart = await this.cartsService.getCart(userId, null);
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new BadRequestException("Cart is empty");
      }

      cartId = cart.id;

      // Create checkout session (CREATED state)
      // Session creation failure is acceptable - we can proceed without state machine
      // but if session exists, we MUST validate its state before proceeding
      try {
        const sessionResult = await this.checkoutStore.createSession(cart.id);
        checkoutSessionId = sessionResult.sessionId;
      } catch (error) {
        // Write failure - log but continue (order creation can proceed without session)
        this.logger.warn(
          `Failed to create checkout session for cart ${cart.id}, proceeding without state machine`,
          error,
        );
        // checkoutSessionId remains null - order creation will skip state validation
      }

      // Acquire checkout lock to prevent concurrent checkout attempts
      lockAcquired = await this.checkoutStore.acquireCheckoutLock(cart.id);
      if (!lockAcquired) {
        // Transition session to FAILED if lock acquisition fails
        if (checkoutSessionId) {
          try {
            await this.checkoutStore.failSession(checkoutSessionId);
          } catch (error) {
            console.error("Failed to fail checkout session:", error);
          }
        }
        throw new ConflictException("Cart is already being checked out");
      }

      // Transition to LOCKED state (lock acquired)
      // Write failure is acceptable - lock is already acquired, preventing duplicates
      if (checkoutSessionId) {
        try {
          await this.checkoutStore.transitionState(
            checkoutSessionId,
            CheckoutState.CREATED,
            CheckoutState.LOCKED,
          );
        } catch (error) {
          // Write failure - log but continue (lock is held, preventing duplicates)
          this.logger.error(
            `State transition to LOCKED failed for session ${checkoutSessionId}, but lock is acquired`,
            error,
          );
        }
      }

      // Get discount code from cart
      const discountCode =
        "discountCode" in cart ? (cart.discountCode as string | null) : null;

      // Get cart items with product variant details
      const cartItemIds = cart.items.map((item) => item.id);
      const cartItemsWithVariantsResult = await db
        .select({
          cartItemId: cartItems.id,
          productVariantId: cartItems.productVariantId,
          quantity: cartItems.quantity,
          price: cartItems.price,
          productGstRate: products.gstRate,
        })
        .from(cartItems)
        .innerJoin(
          productVariants,
          eq(cartItems.productVariantId, productVariants.id),
        )
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(inArray(cartItems.id, cartItemIds));

      // Ensure cartItemsWithVariants is always an array
      const cartItemsWithVariants = Array.isArray(cartItemsWithVariantsResult)
        ? cartItemsWithVariantsResult
        : [];

      if (cartItemsWithVariants.length === 0) {
        throw new BadRequestException("Cart items not found or invalid");
      }

      // Calculate totals
      const sellerState = this.getSellerState();
      const buyerState = shippingAddress.state;

      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      // Calculate subtotal and GST for each item
      for (const item of cartItemsWithVariants) {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        // Calculate GST breakdown
        const gstBreakdown = calculateGstBreakdown(
          itemSubtotal,
          item.productGstRate,
          sellerState,
          buyerState,
        );
        totalCgst += gstBreakdown.cgst;
        totalSgst += gstBreakdown.sgst;
        totalIgst += gstBreakdown.igst;
      }

      const totalGstAmount = totalCgst + totalSgst + totalIgst;
      const shippingCost = createOrderDto.shippingCost || 0;

      // Calculate discount if discount code exists
      let discountAmount = 0;
      if (discountCode) {
        try {
          // Get product IDs from variants
          const variantIds = cartItemsWithVariants.map(
            (item) => item.productVariantId,
          );
          const variantProductMap = await db
            .select({
              variantId: productVariants.id,
              productId: productVariants.productId,
            })
            .from(productVariants)
            .where(inArray(productVariants.id, variantIds));

          const productIds = Array.from(
            new Set(variantProductMap.map((v) => v.productId)),
          );

          // Get product details for discount calculation
          const productDetails = await db
            .select({
              productId: products.id,
              categoryId: products.categoryId,
            })
            .from(products)
            .where(inArray(products.id, productIds));

          const variantToProduct = new Map(
            variantProductMap.map((v) => [v.variantId, v.productId]),
          );

          const productMap = new Map(
            productDetails.map((p) => [p.productId, p]),
          );

          // Build cart items for discount calculation
          const cartItemsForDiscount = cartItemsWithVariants.map((item) => {
            const productId = variantToProduct.get(item.productVariantId);
            const product = productId ? productMap.get(productId) : null;
            return {
              productId: productId || "",
              categoryId: product?.categoryId || null,
              collectionIds: [], // TODO: Add when product-collections junction table exists
              tagIds: [], // TODO: Add when product-tags junction table exists
              price: item.price,
              quantity: item.quantity,
            };
          });

          // Validate discount
          const validation = await this.discountsService.validateDiscount(
            discountCode,
            userId,
            subtotal,
          );

          if (validation.isValid && validation.discount) {
            // Calculate discount
            const discountResult = calculateDiscount(
              validation.discount,
              cartItemsForDiscount,
            );
            discountAmount = discountResult.discountAmount;
          }
        } catch (_error) {
          // Discount validation failed, continue without discount
          discountAmount = 0;
        }
      }

      // Calculate total after discount (discount applies to subtotal before GST)
      const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
      const total = subtotalAfterDiscount + totalGstAmount + shippingCost;

      // Store checkout metadata for order creation (will be used in webhook handler)
      if (!checkoutSessionId) {
        throw new ConflictException(
          "Checkout session is required for payment intent creation",
        );
      }

      const checkoutMetadata: CheckoutMetadata = {
        userId,
        shippingAddressId: createOrderDto.shippingAddressId,
        billingAddressId: createOrderDto.billingAddressId,
        shippingCost: createOrderDto.shippingCost || 0,
        createdAt: new Date().toISOString(),
      };

      try {
        await this.checkoutStore.storeCheckoutMetadata(
          checkoutSessionId,
          checkoutMetadata,
        );
        this.logger.debug(
          `Stored checkout metadata for sessionId=${checkoutSessionId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to store checkout metadata for sessionId=${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw new ConflictException(
          "Failed to store checkout metadata - cannot proceed with payment intent creation",
        );
      }

      // Create payment intent (idempotent - will return existing if already created)
      // This ensures payment is initiated before order creation
      let paymentIntent: PaymentIntent;
      try {
        // Assert checkout state is LOCKED before creating payment intent
        await this.checkoutStore.assertState(
          checkoutSessionId,
          CheckoutState.LOCKED,
        );

        // Create payment intent idempotently
        // Amount is in rupees, convert to paise for Razorpay
        const amountInPaise = Math.round(total * 100);
        paymentIntent = await this.paymentsService.createPaymentIntent(
          checkoutSessionId,
          amountInPaise,
          "INR",
          undefined, // receipt will be generated from checkoutSessionId
          {
            order_number: `pending-${Date.now()}`, // Temporary, will be updated after order creation
          },
        );
        if (!paymentIntent || !paymentIntent.paymentIntentId) {
          throw new ConflictException(
            "Payment intent creation returned invalid result",
          );
        }
        this.logger.debug(
          `Payment intent created: checkoutSessionId=${checkoutSessionId}, paymentIntentId=${paymentIntent.paymentIntentId}`,
        );
      } catch (error) {
        // Payment intent creation failure - MUST BLOCK
        // This is a critical failure - we cannot proceed without payment intent
        this.logger.error(
          `Failed to create payment intent for checkoutSessionId=${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw new ConflictException(
          "Failed to create payment intent - cannot proceed with checkout",
        );
      }

      // Release checkout lock - order creation will happen in webhook handler
      // Lock will be re-acquired in webhook handler before order creation
      if (lockAcquired && cartId) {
        try {
          await this.checkoutStore.releaseCheckoutLock(cartId);
        } catch (error) {
          this.logger.error("Failed to release checkout lock:", error);
        }
      }

      // Return payment intent + session ID
      return {
        paymentIntent,
        checkoutSessionId,
        message: "Payment intent created. Redirect user to payment gateway.",
      };
    } catch (error) {
      // Transition session to FAILED state on error
      if (checkoutSessionId) {
        try {
          await this.checkoutStore.failSession(checkoutSessionId);
        } catch (failError) {
          // Log but don't fail - failure handling should be best-effort
          console.error("Failed to fail checkout session:", failError);
        }
      }

      // Release checkout lock only if it was acquired
      if (lockAcquired && cartId) {
        try {
          await this.checkoutStore.releaseCheckoutLock(cartId);
        } catch (lockError) {
          // Log but don't fail
          console.error("Failed to release checkout lock on error:", lockError);
        }
      }

      throw error;
    }
  }

  /**
   * Finalize order from payment confirmation (webhook-driven)
   * Creates order only after payment is confirmed
   * Uses payment-scoped idempotency to prevent duplicate orders
   */
  async finalizeOrderFromPayment(
    checkoutSessionId: string,
    paymentIntentId: string,
    provider: string = "razorpay",
  ): Promise<OrderResponseDto> {
    // Check payment-scoped idempotency first
    const existingOrderId = await this.checkoutStore.getOrderByPaymentIntent(
      provider,
      paymentIntentId,
    );

    if (existingOrderId) {
      // Order already exists for this payment intent - return existing order
      this.logger.debug(
        `Order already exists for paymentIntentId=${paymentIntentId}, orderId=${existingOrderId}`,
      );
      // Fetch and return existing order
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

      // Calculate GST breakdown (reconstruct from order data)
      const sellerState = this.getSellerState();
      const [shippingAddress] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.shippingAddressId))
        .limit(1);
      const buyerState = shippingAddress?.state || sellerState;
      const isIntraState = sellerState === buyerState;

      // Reconstruct GST breakdown from order items
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      for (const item of orderItemsResult) {
        const itemSubtotal = item.price * item.quantity;
        const gstBreakdown = calculateGstBreakdown(
          itemSubtotal,
          item.gstRate,
          sellerState,
          buyerState,
        );
        totalCgst += gstBreakdown.cgst;
        totalSgst += gstBreakdown.sgst;
        totalIgst += gstBreakdown.igst;
      }

      const gstBreakdown = {
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        totalGst: order.gstAmount,
        isIntraState,
      };

      return {
        ...order,
        gstBreakdown,
        items: orderItemsResult,
      } as OrderResponseDto;
    }

    // Get checkout session and metadata
    const session = await this.checkoutStore.getSession(checkoutSessionId);
    if (!session) {
      throw new NotFoundException(
        `Checkout session ${checkoutSessionId} not found`,
      );
    }

    // Validate state - must be PAYMENT_CONFIRMED
    if (session.state !== CheckoutState.PAYMENT_CONFIRMED) {
      throw new ConflictException(
        `Cannot create order: checkout session is in state ${session.state}, expected PAYMENT_CONFIRMED`,
      );
    }

    // Get checkout metadata
    const metadata =
      await this.checkoutStore.getCheckoutMetadata(checkoutSessionId);
    if (!metadata) {
      throw new NotFoundException(
        `Checkout metadata not found for session ${checkoutSessionId}`,
      );
    }

    // Get customer ID from userId
    const customerId = await this.getCustomerId(metadata.userId);

    // Get cart data
    const cart = await this.cartsService.getCart(metadata.userId, null);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty or not found");
    }

    // Get cart items with product variant details
    const cartItemIds = cart.items.map((item) => item.id);
    const cartItemsWithVariantsResult = await db
      .select({
        cartItemId: cartItems.id,
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
        price: cartItems.price,
        productGstRate: products.gstRate,
      })
      .from(cartItems)
      .innerJoin(
        productVariants,
        eq(cartItems.productVariantId, productVariants.id),
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(cartItems.id, cartItemIds));

    const cartItemsWithVariants = Array.isArray(cartItemsWithVariantsResult)
      ? cartItemsWithVariantsResult
      : [];

    if (cartItemsWithVariants.length === 0) {
      throw new BadRequestException("Cart items not found or invalid");
    }

    // Get shipping address for GST calculation
    const [shippingAddress] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, metadata.shippingAddressId))
      .limit(1);

    if (!shippingAddress) {
      throw new NotFoundException("Shipping address not found");
    }

    // Calculate totals
    const sellerState = this.getSellerState();
    const buyerState = shippingAddress.state;

    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (const item of cartItemsWithVariants) {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;

      const gstBreakdown = calculateGstBreakdown(
        itemSubtotal,
        item.productGstRate,
        sellerState,
        buyerState,
      );
      totalCgst += gstBreakdown.cgst;
      totalSgst += gstBreakdown.sgst;
      totalIgst += gstBreakdown.igst;
    }

    const totalGstAmount = totalCgst + totalSgst + totalIgst;
    const shippingCost = metadata.shippingCost;

    // Get discount code from cart
    const discountCode =
      "discountCode" in cart ? (cart.discountCode as string | null) : null;
    let discountAmount = 0;

    // Calculate discount if discount code exists
    if (discountCode) {
      try {
        const variantIds = cartItemsWithVariants.map(
          (item) => item.productVariantId,
        );
        const variantProductMap = await db
          .select({
            variantId: productVariants.id,
            productId: productVariants.productId,
          })
          .from(productVariants)
          .where(inArray(productVariants.id, variantIds));

        const productIds = Array.from(
          new Set(variantProductMap.map((v) => v.productId)),
        );

        const productDetails = await db
          .select({
            productId: products.id,
            categoryId: products.categoryId,
          })
          .from(products)
          .where(inArray(products.id, productIds));

        const variantToProduct = new Map(
          variantProductMap.map((v) => [v.variantId, v.productId]),
        );

        const productMap = new Map(productDetails.map((p) => [p.productId, p]));

        const cartItemsForDiscount = cartItemsWithVariants.map((item) => {
          const productId = variantToProduct.get(item.productVariantId);
          const product = productId ? productMap.get(productId) : null;
          return {
            productId: productId || "",
            categoryId: product?.categoryId || null,
            collectionIds: [],
            tagIds: [],
            price: item.price,
            quantity: item.quantity,
          };
        });

        const validation = await this.discountsService.validateDiscount(
          discountCode,
          metadata.userId,
          subtotal,
        );

        if (validation.isValid && validation.discount) {
          const discountResult = calculateDiscount(
            validation.discount,
            cartItemsForDiscount,
          );
          discountAmount = discountResult.discountAmount;
        }
      } catch (_error) {
        discountAmount = 0;
      }
    }

      const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
      const total = subtotalAfterDiscount + totalGstAmount + shippingCost;

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

    // Create order atomically using payment-scoped idempotency
    let orderId: string;
    try {
      // Create order in database
      const [order] = await db
        .insert(orders)
        .values({
          customerId,
          orderNumber,
          status: "pending",
          subtotal,
          gstAmount: totalGstAmount,
          discountCode,
          discountAmount,
          shippingCost,
          total,
          shippingAddressId: metadata.shippingAddressId,
          billingAddressId: metadata.billingAddressId,
          razorpayOrderId: paymentIntentId,
        })
        .returning();

      orderId = order.id;

      // Atomically create payment-scoped idempotency mapping
      // This ensures exactly one order per payment intent
      const mappedOrderId = await this.checkoutStore.createOrderFromPayment(
        provider,
        paymentIntentId,
        orderId,
      );

      // If mapping returned different order ID, another process created it concurrently
      if (mappedOrderId !== orderId) {
        this.logger.warn(
          `Concurrent order creation detected: created ${orderId} but mapping returned ${mappedOrderId}. Using existing order.`,
        );
        // Delete the duplicate order we just created
        await db.delete(orders).where(eq(orders.id, orderId));
        // Return existing order
        return this.finalizeOrderFromPayment(
          checkoutSessionId,
          paymentIntentId,
          provider,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create order for paymentIntentId=${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }

    // Transition to ORDER_CREATED state
    try {
      await this.checkoutStore.setOrder(checkoutSessionId, orderId);
      await this.checkoutStore.transitionState(
        checkoutSessionId,
        CheckoutState.PAYMENT_CONFIRMED,
        CheckoutState.ORDER_CREATED,
      );
    } catch (error) {
      this.logger.error(
        `Failed to transition to ORDER_CREATED for session ${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Continue - order is created, state transition failure is non-critical
    }

      // Record discount usage if discount was applied
      if (discountCode && discountAmount > 0) {
        try {
          const discount = await this.discountsService.findByCode(discountCode);
          await this.discountsService.recordUsage(
            discount.id,
          orderId,
          metadata.userId,
          );
        } catch (error) {
        this.logger.error("Failed to record discount usage:", error);
        }
      }

      // Create order items
      const orderItemsToInsert = cartItemsWithVariants.map((item) => {
        const itemSubtotal = item.price * item.quantity;
        const gstBreakdown = calculateGstBreakdown(
          itemSubtotal,
          item.productGstRate,
          sellerState,
          buyerState,
        );

        return {
        orderId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          price: item.price,
          gstRate: item.productGstRate,
          gstAmount: gstBreakdown.totalGst,
        };
      });

      const insertedOrderItems = await db
        .insert(orderItems)
        .values(orderItemsToInsert)
        .returning();

    // Commit inventory (convert reserved → consumed)
    // This happens AFTER payment confirmation
    try {
      // Release all cart reservations (individual reservation keys)
      await this.inventoryStore.releaseCartReservations(cart.id);

      // Commit reservations (decrement available inventory)
      for (const item of cartItemsWithVariants) {
        await this.inventoryStore.incrementInventory(
          item.productVariantId,
          -item.quantity,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to commit inventory for order ${orderId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Continue - inventory commit failure should be handled separately
      // Order is already created, inventory can be reconciled later
      }

      // Clear cart
    try {
      await this.cartsService.clearCart(metadata.userId, null);
    } catch (error) {
      this.logger.error("Failed to clear cart:", error);
    }

      // Calculate overall GST breakdown
      const isIntraState = sellerState === buyerState;
      const gstBreakdown = {
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        totalGst: totalGstAmount,
        isIntraState,
      };

      // Build order response
    const orderResponse: OrderResponseDto = {
      id: orderId,
      customerId,
      orderNumber,
      status: "pending",
      subtotal,
      gstAmount: totalGstAmount,
        gstBreakdown,
      shippingCost,
      total,
      razorpayOrderId: paymentIntentId,
      shippingProvider: null,
      shippingAddressId: metadata.shippingAddressId,
      billingAddressId: metadata.billingAddressId,
      discountCode,
      discountAmount,
        items: insertedOrderItems,
      createdAt: new Date(),
      updatedAt: new Date(),
      } as OrderResponseDto;

    // Transition to COMPLETED state
    try {
      await this.checkoutStore.transitionState(
        checkoutSessionId,
        CheckoutState.ORDER_CREATED,
        CheckoutState.COMPLETED,
      );
      } catch (error) {
      this.logger.error(
        `Failed to transition to COMPLETED for session ${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      }

    this.logger.log(
      `Order finalized: orderId=${orderId}, paymentIntentId=${paymentIntentId}, checkoutSessionId=${checkoutSessionId}`,
        );

    return orderResponse;
  }

  /**
   * Get order by ID (for authenticated customer)
   */
  async findOne(userId: string, orderId: string) {
    const customerId = await this.getCustomerId(userId);

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Get order items with GST rates
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productVariantId: orderItems.productVariantId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        gstRate: orderItems.gstRate,
        gstAmount: orderItems.gstAmount,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Get shipping address for GST calculation
    const [shippingAddress] = await db
      .select({ state: addresses.state })
      .from(addresses)
      .where(eq(addresses.id, order.shippingAddressId))
      .limit(1);

    // Calculate GST breakdown
    const sellerState = this.getSellerState();
    const buyerState = shippingAddress?.state || "";

    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (const item of items) {
      const itemSubtotal = item.price * item.quantity;
      const gstBreakdown = calculateGstBreakdown(
        itemSubtotal,
        item.gstRate,
        sellerState,
        buyerState,
      );
      totalCgst += gstBreakdown.cgst;
      totalSgst += gstBreakdown.sgst;
      totalIgst += gstBreakdown.igst;
    }

    const gstBreakdown = {
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalGst: order.gstAmount,
      isIntraState: sellerState === buyerState,
    };

    return {
      ...order,
      gstBreakdown,
      items,
    } as OrderResponseDto;
  }

  /**
   * Calculate GST breakdown for an order
   */
  private async calculateOrderGstBreakdown(
    orderId: string,
    shippingAddressId: string,
  ): Promise<{
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    isIntraState: boolean;
  }> {
    // Get order items with GST rates
    const items = await db
      .select({
        quantity: orderItems.quantity,
        price: orderItems.price,
        gstRate: orderItems.gstRate,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Get shipping address state
    const [shippingAddress] = await db
      .select({ state: addresses.state })
      .from(addresses)
      .where(eq(addresses.id, shippingAddressId))
      .limit(1);

    const sellerState = this.getSellerState();
    const buyerState = shippingAddress?.state || "";

    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    // Ensure items is an array (for test compatibility)
    const itemsArray = Array.isArray(items) ? items : [];

    for (const item of itemsArray) {
      const itemSubtotal = item.price * item.quantity;
      const gstBreakdown = calculateGstBreakdown(
        itemSubtotal,
        item.gstRate,
        sellerState,
        buyerState,
      );
      totalCgst += gstBreakdown.cgst;
      totalSgst += gstBreakdown.sgst;
      totalIgst += gstBreakdown.igst;
    }

    return {
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalGst: totalCgst + totalSgst + totalIgst,
      isIntraState: sellerState === buyerState,
    };
  }

  /**
   * Get all orders for authenticated customer
   * @param userId - User ID
   * @param status - Optional status filter
   */
  async findAll(userId: string, status?: OrderStatus) {
    const customerId = await this.getCustomerId(userId);

    const whereConditions = status
      ? and(eq(orders.customerId, customerId), eq(orders.status, status))
      : eq(orders.customerId, customerId);

    const customerOrders = await db
      .select()
      .from(orders)
      .where(whereConditions)
      .orderBy(desc(orders.createdAt));

    // Get items and GST breakdown for each order
    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        const gstBreakdown = await this.calculateOrderGstBreakdown(
          order.id,
          order.shippingAddressId,
        );

        return {
          ...order,
          gstBreakdown,
          items,
        } as OrderResponseDto;
      }),
    );

    return ordersWithItems;
  }

  /**
   * Validate status transition
   * Ensures status changes follow a valid workflow
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<string, OrderStatus[]> = {
      pending: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      confirmed: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      processing: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      shipped: [OrderStatus.DELIVERED],
      delivered: [OrderStatus.REFUNDED],
      cancelled: [], // Cannot transition from cancelled
      refunded: [], // Cannot transition from refunded
    };

    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change order status from '${currentStatus}' to '${newStatus}'. ` +
          `Valid transitions from '${currentStatus}': ${allowedStatuses.join(", ") || "none"}`,
      );
    }
  }

  /**
   * Update order status
   * Validates status transition and updates the order
   */
  async updateStatus(
    userId: string,
    orderId: string,
    updateStatusDto: UpdateOrderStatusDto,
  ) {
    const customerId = await this.getCustomerId(userId);

    // Get current order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Validate status transition
    this.validateStatusTransition(order.status, updateStatusDto.status);

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: updateStatusDto.status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const gstBreakdown = await this.calculateOrderGstBreakdown(
      orderId,
      updatedOrder.shippingAddressId,
    );

    return {
      ...updatedOrder,
      gstBreakdown,
      items,
    } as OrderResponseDto;
  }

  /**
   * Get order tracking information
   * Returns order details with shipment tracking information
   */
  async getTracking(
    userId: string,
    orderId: string,
  ): Promise<OrderTrackingDto> {
    const customerId = await this.getCustomerId(userId);

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Get shipments for this order
    const orderShipments = await db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .orderBy(desc(shipments.createdAt));

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingProvider: order.shippingProvider,
      shipments: orderShipments.map((shipment) => ({
        id: shipment.id,
        provider: shipment.provider,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        labelUrl: shipment.labelUrl,
        awbNumber: shipment.awbNumber,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Get order timeline
   * Returns chronological list of all events related to the order
   */
  async getTimeline(
    userId: string,
    orderId: string,
  ): Promise<OrderTimelineDto> {
    const customerId = await this.getCustomerId(userId);

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const events: TimelineEventDto[] = [];

    // Add order creation event
    events.push({
      type: TimelineEventType.ORDER_CREATED,
      title: "Order Created",
      description: `Order ${order.orderNumber} was created`,
      timestamp: order.createdAt,
      metadata: {
        orderNumber: order.orderNumber,
        total: order.total,
      },
    });

    // Get payments for this order
    const orderPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));

    // Add payment events
    for (const payment of orderPayments) {
      events.push({
        type: TimelineEventType.PAYMENT_INITIATED,
        title: "Payment Initiated",
        description: `Payment of ₹${payment.amount} initiated via ${payment.method}`,
        timestamp: payment.createdAt,
        metadata: {
          paymentId: payment.id,
          amount: payment.amount,
          method: payment.method,
          razorpayPaymentId: payment.razorpayPaymentId,
        },
      });

      if (payment.status === "captured") {
        events.push({
          type: TimelineEventType.PAYMENT_COMPLETED,
          title: "Payment Completed",
          description: `Payment of ₹${payment.amount} was successfully completed`,
          timestamp: payment.updatedAt,
          metadata: {
            paymentId: payment.id,
            amount: payment.amount,
            method: payment.method,
          },
        });
      } else if (payment.status === "failed") {
        events.push({
          type: TimelineEventType.PAYMENT_FAILED,
          title: "Payment Failed",
          description: `Payment of ₹${payment.amount} failed`,
          timestamp: payment.updatedAt,
          metadata: {
            paymentId: payment.id,
            amount: payment.amount,
            method: payment.method,
          },
        });
      }
    }

    // Get shipments for this order
    const orderShipments = await db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .orderBy(desc(shipments.createdAt));

    // Add shipment events
    for (const shipment of orderShipments) {
      events.push({
        type: TimelineEventType.SHIPMENT_CREATED,
        title: "Shipment Created",
        description: `Shipment created via ${shipment.provider}`,
        timestamp: shipment.createdAt,
        metadata: {
          shipmentId: shipment.id,
          provider: shipment.provider,
        },
      });

      // Add shipment status-specific events
      if (shipment.status === "label_generated") {
        events.push({
          type: TimelineEventType.SHIPMENT_LABEL_GENERATED,
          title: "Shipping Label Generated",
          description: `Shipping label generated${shipment.trackingNumber ? ` with tracking number ${shipment.trackingNumber}` : ""}`,
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            labelUrl: shipment.labelUrl,
            awbNumber: shipment.awbNumber,
          },
        });
      } else if (shipment.status === "picked_up") {
        events.push({
          type: TimelineEventType.SHIPMENT_PICKED_UP,
          title: "Shipment Picked Up",
          description: `Shipment picked up by courier${shipment.trackingNumber ? ` (Tracking: ${shipment.trackingNumber})` : ""}`,
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
          },
        });
      } else if (shipment.status === "in_transit") {
        events.push({
          type: TimelineEventType.SHIPMENT_IN_TRANSIT,
          title: "Shipment In Transit",
          description: `Shipment is in transit${shipment.trackingNumber ? ` (Tracking: ${shipment.trackingNumber})` : ""}`,
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
          },
        });
      } else if (shipment.status === "out_for_delivery") {
        events.push({
          type: TimelineEventType.SHIPMENT_OUT_FOR_DELIVERY,
          title: "Out for Delivery",
          description: `Shipment is out for delivery${shipment.trackingNumber ? ` (Tracking: ${shipment.trackingNumber})` : ""}`,
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
          },
        });
      } else if (shipment.status === "delivered") {
        events.push({
          type: TimelineEventType.SHIPMENT_DELIVERED,
          title: "Shipment Delivered",
          description: `Shipment has been delivered${shipment.trackingNumber ? ` (Tracking: ${shipment.trackingNumber})` : ""}`,
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
          },
        });
      } else if (shipment.status === "failed") {
        events.push({
          type: TimelineEventType.SHIPMENT_FAILED,
          title: "Shipment Failed",
          description: `Shipment delivery failed${shipment.trackingNumber ? ` (Tracking: ${shipment.trackingNumber})` : ""}`,
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
          },
        });
      } else if (shipment.status === "returned") {
        events.push({
          type: TimelineEventType.SHIPMENT_RETURNED,
          title: "Shipment Returned",
          description: `Shipment has been returned${shipment.trackingNumber ? ` (Tracking: ${shipment.trackingNumber})` : ""}`,
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
          },
        });
      }
    }

    // Note: Status changes are tracked via order.updatedAt
    // In a real system, you might want to track status changes separately
    // For now, we'll add a status change event based on the current status
    if (order.status !== "pending") {
      events.push({
        type: TimelineEventType.STATUS_CHANGED,
        title: "Order Status Updated",
        description: `Order status is now '${order.status}'`,
        newValue: order.status,
        timestamp: order.updatedAt,
        metadata: {
          currentStatus: order.status,
        },
      });
    }

    // Sort events by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      events,
    };
  }
}
