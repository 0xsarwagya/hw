import { createHash } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
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
import { KEY_PATTERNS } from "../redis-store/constants/key-patterns";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { IdempotencyStore } from "../redis-store/stores/idempotency-store";
import { InventoryStore } from "../redis-store/stores/inventory-store";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import {
  OrderTimelineDto,
  TimelineEventDto,
  TimelineEventType,
} from "./dto/order-timeline.dto";
import { OrderTrackingDto } from "./dto/order-tracking.dto";
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
    private readonly idempotencyStore: IdempotencyStore,
    private readonly checkoutStore: CheckoutStore,
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
   * Create order from cart
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    // Generate or use provided idempotency key
    let idempotencyKey = createOrderDto.idempotencyKey;
    if (!idempotencyKey) {
      // Generate key from userId + cartId + timestamp (rounded to minute)
      const cart = await this.cartsService.getCart(userId, null);
      const cartId = cart?.id || "unknown";
      const timestamp = Math.floor(Date.now() / 60000); // Round to minute
      const hashInput = `${userId}:${cartId}:${timestamp}`;
      idempotencyKey = createHash("sha256").update(hashInput).digest("hex");
    }

    // Check idempotency
    const operation = "order:create";
    const existingResult =
      await this.idempotencyStore.getIdempotencyResult<OrderResponseDto>(
        operation,
        idempotencyKey,
      );

    if (existingResult) {
      // Return stored result for duplicate request
      return existingResult;
    }

    // Check if idempotency key was already set (race condition check)
    const wasSet = await this.idempotencyStore.checkAndSet(
      operation,
      idempotencyKey,
      { pending: true }, // Temporary value
    );

    if (!wasSet) {
      // Another request is processing, wait a bit and return stored result
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result =
        await this.idempotencyStore.getIdempotencyResult<OrderResponseDto>(
          operation,
          idempotencyKey,
        );
      if (result && !("pending" in result)) {
        return result;
      }
      // If still pending or no result, proceed (edge case)
    }

    let orderResponse: OrderResponseDto;
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

      // Create payment intent BEFORE order creation (idempotent)
      // This ensures payment is initiated before order is created
      let paymentIntentId: string | null = null;
      if (checkoutSessionId) {
        try {
          // Assert checkout state is LOCKED before creating payment intent
          await this.checkoutStore.assertState(
            checkoutSessionId,
            CheckoutState.LOCKED,
          );

          // Create payment intent idempotently
          // Amount is in rupees, convert to paise for Razorpay
          const amountInPaise = Math.round(total * 100);
          const paymentIntent = await this.paymentsService.createPaymentIntent(
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
          paymentIntentId = paymentIntent.paymentIntentId;
          this.logger.debug(
            `Payment intent created: checkoutSessionId=${checkoutSessionId}, paymentIntentId=${paymentIntentId}`,
          );
        } catch (error) {
          // Payment intent creation failure - MUST BLOCK order creation
          // This is a critical failure - we cannot create order without payment intent
          this.logger.error(
            `Failed to create payment intent for checkoutSessionId=${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          throw new ConflictException(
            "Failed to create payment intent - cannot proceed with order creation",
          );
        }
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // CRITICAL: Validate checkout state before order creation
      // State machine READ/validation failures MUST BLOCK - we cannot proceed
      // with unknown or invalid states as this could lead to duplicate orders
      if (checkoutSessionId) {
        try {
          // Assert we're in a valid state to create an order
          // After payment intent creation, state should be PAYMENT_PENDING
          // We also allow PAYMENT_CONFIRMED (if webhook already processed)
          await this.checkoutStore.assertStateIn(checkoutSessionId, [
            CheckoutState.PAYMENT_PENDING,
            CheckoutState.PAYMENT_CONFIRMED,
          ]);
        } catch (error) {
          // State validation failure - MUST BLOCK order creation
          // This is a read/validation failure, not a write failure
          this.logger.error(
            `Cannot create order: invalid checkout state for session ${checkoutSessionId}`,
            error,
          );
          throw new ConflictException(
            "Invalid checkout state - cannot proceed with order creation",
          );
        }
      }

      // Create order (inventory commit happens here - critical boundary)
      // Note: This is guarded by:
      // 1. Checkout lock (prevents concurrent checkouts)
      // 2. Idempotency (prevents duplicate orders)
      // 3. State validation above (ensures valid state)
      // 4. Payment intent creation (ensures payment is initiated)
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
          shippingAddressId: createOrderDto.shippingAddressId,
          billingAddressId: createOrderDto.billingAddressId,
          razorpayOrderId: paymentIntentId || null, // Store payment intent ID (Razorpay order ID)
        })
        .returning();

      // Transition to ORDER_CREATED and set orderId
      // State machine WRITE failures can be soft-failed because:
      // 1. Order is already created (idempotent)
      // 2. Checkout lock is held (prevents duplicates)
      // 3. State was validated above (we know we're in valid state)
      if (checkoutSessionId) {
        try {
          await this.checkoutStore.setOrder(checkoutSessionId, order.id);
          // Determine current state for transition
          const session =
            await this.checkoutStore.getSession(checkoutSessionId);
          const currentState = session?.state || CheckoutState.LOCKED;
          await this.checkoutStore.transitionState(
            checkoutSessionId,
            currentState,
            CheckoutState.ORDER_CREATED,
          );
        } catch (error) {
          // Write failure - log but continue ONLY because:
          // - Order creation is idempotent
          // - Checkout lock prevents concurrent execution
          // - State was validated before order creation
          this.logger.error(
            `State transition to ORDER_CREATED failed for session ${checkoutSessionId}, but order ${order.id} was created successfully`,
            error,
          );
          // Continue - order is already created and guarded by idempotency + lock
        }
      }

      // Record discount usage if discount was applied
      if (discountCode && discountAmount > 0) {
        try {
          const discount = await this.discountsService.findByCode(discountCode);
          await this.discountsService.recordUsage(
            discount.id,
            order.id,
            userId,
          );
        } catch (error) {
          // Log error but don't fail order creation
          console.error("Failed to record discount usage:", error);
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
          orderId: order.id,
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

      // Release all cart reservations (individual reservation keys)
      // This must happen before committing to avoid double-counting
      await this.inventoryStore.releaseCartReservations(cart.id);

      // Commit reservations (convert reserved → consumed)
      // Note: releaseCartReservations already decremented aggregated reserved count
      // So we just need to decrement available inventory
      for (const item of cartItemsWithVariants) {
        await this.inventoryStore.incrementInventory(
          item.productVariantId,
          -item.quantity,
        );
      }

      // Clear cart
      await this.cartsService.clearCart(userId, null);

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
      orderResponse = {
        ...order,
        gstBreakdown,
        items: insertedOrderItems,
      } as OrderResponseDto;

      // Store result in idempotency store (update the placeholder)
      try {
        const idempotencyRedisKey = KEY_PATTERNS.IDEMPOTENCY(
          operation,
          idempotencyKey,
        );
        await this.idempotencyStore.set(idempotencyRedisKey, orderResponse);
      } catch (error) {
        // Log but don't fail order creation if idempotency store fails
        console.error("Failed to store idempotency result:", error);
      }

      // Transition to COMPLETED state (order finalized)
      // Write failure is acceptable here - order is already complete
      if (checkoutSessionId) {
        try {
          await this.checkoutStore.transitionState(
            checkoutSessionId,
            CheckoutState.ORDER_CREATED,
            CheckoutState.COMPLETED,
          );
        } catch (error) {
          // Write failure - log but continue (order is already complete)
          this.logger.error(
            `State transition to COMPLETED failed for session ${checkoutSessionId}, but order ${orderResponse.id} is complete`,
            error,
          );
        }
      }

      // Release checkout lock on successful order creation
      if (lockAcquired && cartId) {
        try {
          await this.checkoutStore.releaseCheckoutLock(cartId);
        } catch (error) {
          // Log but don't fail order creation if lock release fails
          console.error("Failed to release checkout lock:", error);
        }
      }

      return orderResponse;
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

      try {
        await this.idempotencyStore.deleteIdempotency(
          operation,
          idempotencyKey,
        );
      } catch (deleteError) {
        // Log but don't fail
        console.error(
          "Failed to delete idempotency key on error:",
          deleteError,
        );
      }
      throw error;
    }
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
