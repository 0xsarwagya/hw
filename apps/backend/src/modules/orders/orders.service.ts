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
  productCollections,
  products,
  productTags,
  productVariants,
  shipments,
} from "@vcecom/db";
import { calculateGstBreakdown } from "../../common/utils/gst.utils";
import { CartsService } from "../carts/carts.service";
import { BundleCartItemMetadata } from "../carts/dto/bundle-cart-item.dto";
import { DiscountsService } from "../discounts/discounts.service";
import { runDiscountEngine } from "../discounts/engine/discount-engine";
import {
  DiscountEngineInput,
  DiscountSnapshot,
} from "../discounts/engine/discount-engine.types";
import { createDiscountSnapshot } from "../discounts/engine/discount-snapshot.utils";
import { DiscountAuditService } from "../discounts/services/discount-audit.service";
import { DiscountProfiler } from "../discounts/services/discount-profiler.service";
import { DiscountSnapshotValidator } from "../discounts/services/discount-snapshot-validator.service";
import { DriftDetectorService } from "../discounts/services/drift-detector.service";
import { HotReloadWatcher } from "../discounts/services/hot-reload-watcher.service";
import { RulesetBundleService } from "../discounts/services/ruleset-bundle.service";
import { PaymentsService } from "../payments/payments.service";
import { PricingDriftSeverity } from "../pricing/audit/pricing-audit.types";
import { runPricingEngine } from "../pricing/engine/pricing-engine";
import {
  PricingEngineInput,
  PricingSnapshot,
} from "../pricing/engine/pricing-engine.types";
import { createPricingSnapshot } from "../pricing/engine/pricing-snapshot.utils";
import { BundlePricingService } from "../pricing/services/bundle-pricing.service";
import { CustomerGroupService } from "../pricing/services/customer-group.service";
import { PriceListService } from "../pricing/services/price-list.service";
import { PricingAuditService } from "../pricing/services/pricing-audit.service";
import { PricingDriftDetectorService } from "../pricing/services/pricing-drift-detector.service";
import { PricingHotReloadWatcher } from "../pricing/services/pricing-hot-reload-watcher.service";
import { PricingSnapshotValidator } from "../pricing/services/pricing-snapshot-validator.service";
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
    private readonly discountSnapshotValidator: DiscountSnapshotValidator,
    private readonly discountAuditService: DiscountAuditService,
    private readonly driftDetector: DriftDetectorService,
    private readonly hotReloadWatcher: HotReloadWatcher,
    private readonly bundleService: RulesetBundleService,
    private readonly discountProfiler: DiscountProfiler,
    private readonly pricingHotReloadWatcher: PricingHotReloadWatcher,
    private readonly priceListService: PriceListService,
    private readonly customerGroupService: CustomerGroupService,
    private readonly pricingSnapshotValidator: PricingSnapshotValidator,
    private readonly pricingAuditService: PricingAuditService,
    private readonly pricingDriftDetector: PricingDriftDetectorService,
    private readonly bundlePricingService: BundlePricingService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Get customer group ID for a customer
   */
  private async getCustomerGroupId(customerId: string): Promise<string | null> {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);
      return customer?.customerGroupId || null;
    } catch (error) {
      this.logger.error(
        `Failed to get customer group: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Get price lists for a customer (based on customer group)
   */
  private async getPriceListsForCustomer(
    customerGroupId: string | null,
  ): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      priority: number;
      isActive: boolean;
      startDate?: Date;
      endDate?: Date;
      items: Array<{
        id: string;
        productVariantId?: string;
        productId?: string;
        categoryId?: string;
        overrideType: "FIXED" | "PERCENTAGE";
        overrideValue: number;
      }>;
    }>
  > {
    try {
      if (!customerGroupId) {
        // No customer group, return empty price lists
        return [];
      }

      const group = await this.customerGroupService.findOne(customerGroupId);
      const priceListIds = group.priceLists.map((pl) => pl.priceListId);

      if (priceListIds.length === 0) {
        return [];
      }

      const priceLists = await Promise.all(
        priceListIds.map((id) => this.priceListService.findOne(id)),
      );

      // Convert to PricingEngineInput format
      return priceLists.map((list) => ({
        id: list.id,
        name: list.name,
        type: list.type,
        priority: list.priority,
        isActive: list.isActive,
        startDate: list.startDate || undefined,
        endDate: list.endDate || undefined,
        items: list.items.map((item) => ({
          id: item.id,
          productVariantId: item.productVariantId || undefined,
          productId: item.productId || undefined,
          categoryId: item.categoryId || undefined,
          overrideType: item.overrideType as "FIXED" | "PERCENTAGE",
          overrideValue: item.overrideValue,
        })),
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get price lists for customer group: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return [];
    }
  }

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

      // Get cart items with metadata
      const cartItemIds = cart.items.map((item) => item.id);
      const allCartItems = await db
        .select({
          id: cartItems.id,
          productVariantId: cartItems.productVariantId,
          quantity: cartItems.quantity,
          price: cartItems.price,
          metadata: cartItems.metadata,
        })
        .from(cartItems)
        .where(inArray(cartItems.id, cartItemIds));

      if (allCartItems.length === 0) {
        throw new BadRequestException("Cart items not found or invalid");
      }

      // Separate bundle and variant items
      const bundleCartItems: Array<{
        id: string;
        productVariantId: string;
        quantity: number;
        price: number;
        metadata: unknown;
      }> = [];
      const variantCartItems: Array<{
        id: string;
        productVariantId: string;
        quantity: number;
        price: number;
        metadata: unknown;
      }> = [];

      for (const item of allCartItems) {
        const metadata = item.metadata as BundleCartItemMetadata | null;
        if (metadata?.type === "bundle") {
          bundleCartItems.push(item);
        } else {
          variantCartItems.push(item);
        }
      }

      // Get variant items with product details
      const variantItemIds = variantCartItems.map((i) => i.id);
      const cartItemsWithVariantsResult =
        variantItemIds.length > 0
          ? await db
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
              .where(inArray(cartItems.id, variantItemIds))
          : [];

      const cartItemsWithVariants = Array.isArray(cartItemsWithVariantsResult)
        ? cartItemsWithVariantsResult
        : [];

      // Calculate totals
      const sellerState = this.getSellerState();
      const buyerState = shippingAddress.state;

      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      // Calculate subtotal and GST for variant items
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

      // Calculate subtotal and GST for bundle items
      for (const bundleItem of bundleCartItems) {
        const itemSubtotal = bundleItem.price * bundleItem.quantity;
        subtotal += itemSubtotal;

        // Get GST rate from first variant's product
        const [firstVariant] = await db
          .select({
            productId: productVariants.productId,
          })
          .from(productVariants)
          .where(eq(productVariants.id, bundleItem.productVariantId))
          .limit(1);

        if (firstVariant) {
          const [product] = await db
            .select({
              gstRate: products.gstRate,
            })
            .from(products)
            .where(eq(products.id, firstVariant.productId))
            .limit(1);

          if (product) {
            const gstBreakdown = calculateGstBreakdown(
              itemSubtotal,
              product.gstRate,
              sellerState,
              buyerState,
            );
            totalCgst += gstBreakdown.cgst;
            totalSgst += gstBreakdown.sgst;
            totalIgst += gstBreakdown.igst;
          }
        }
      }

      const totalGstAmount = totalCgst + totalSgst + totalIgst;
      const shippingCost = createOrderDto.shippingCost || 0;

      // Flatten bundles for pricing/discount engines
      const bundleVariantMapping = new Map<string, string[]>(); // bundleLineId -> [variantIds]
      const flattenedBundleVariants: Array<{
        variantId: string;
        productId: string;
        categoryId: string | null;
        basePrice: number;
        quantity: number;
        bundleLineId?: string;
      }> = [];

      for (const bundleItem of bundleCartItems) {
        const metadata = bundleItem.metadata as BundleCartItemMetadata;
        const variantQuantities =
          this.bundlePricingService.flattenBundleSelections(
            metadata.selections,
            bundleItem.quantity,
          );

        const bundleVariantIds: string[] = [];
        for (const vq of variantQuantities) {
          const [variant] = await db
            .select({
              productId: productVariants.productId,
            })
            .from(productVariants)
            .where(eq(productVariants.id, vq.variantId))
            .limit(1);

          if (variant) {
            bundleVariantIds.push(vq.variantId);
            const [product] = await db
              .select({
                categoryId: products.categoryId,
              })
              .from(products)
              .where(eq(products.id, variant.productId))
              .limit(1);

            // Get unit price from bundle breakdown
            const unitPrice = bundleItem.price / variantQuantities.length;
            flattenedBundleVariants.push({
              variantId: vq.variantId,
              productId: variant.productId,
              categoryId: product?.categoryId || null,
              basePrice: unitPrice,
              quantity: vq.quantity,
              bundleLineId: bundleItem.id,
            });
          }
        }
        bundleVariantMapping.set(bundleItem.id, bundleVariantIds);
      }

      // Get product IDs from variants (needed for both pricing and discount engines)
      const variantIds = [
        ...cartItemsWithVariants.map((item) => item.productVariantId),
        ...flattenedBundleVariants.map((v) => v.variantId),
      ];
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

      // Get product details
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

      // STEP 1: Run pricing engine to get effective prices (before discounts)
      let pricingSnapshot: PricingSnapshot | null = null;
      let effectiveSubtotal = subtotal; // Default to base subtotal

      try {
        // Get customer group for price list resolution
        const customerGroupId = customerId
          ? await this.getCustomerGroupId(customerId)
          : null;

        // Get active price lists for customer group
        const activePriceLists =
          await this.getPriceListsForCustomer(customerGroupId);

        // Build variant pricing input (variants + flattened bundles)
        const variantPricingInput = [
          ...cartItemsWithVariants.map((item) => {
            const productId = variantToProduct.get(item.productVariantId);
            const product = productId ? productMap.get(productId) : null;
            return {
              variantId: item.productVariantId,
              productId: productId || "",
              categoryId: product?.categoryId || null,
              basePrice: item.price,
              compareAtPrice: undefined, // TODO: Load from variant
              salePrice: undefined, // TODO: Load from variant
              saleStartDate: undefined,
              saleEndDate: undefined,
            };
          }),
          ...flattenedBundleVariants.map((v) => ({
            variantId: v.variantId,
            productId: v.productId,
            categoryId: v.categoryId,
            basePrice: v.basePrice,
            compareAtPrice: undefined,
            salePrice: undefined,
            saleStartDate: undefined,
            saleEndDate: undefined,
          })),
        ];

        // Run pricing engine
        const pricingInput: PricingEngineInput = {
          variants: variantPricingInput,
          customer: customerId
            ? {
                id: customerId,
                customerGroupId,
              }
            : null,
          priceLists: activePriceLists,
          now: new Date(),
        };

        const pricingResult = runPricingEngine(pricingInput);
        effectiveSubtotal = pricingResult.totalEffectivePrice;

        // Create bundle breakdowns for pricing snapshot
        const bundlePricingBreakdowns: Array<{
          bundleId: string;
          bundleLineId: string;
          unitBundlePrice: number;
          variantBreakdown: Array<{
            variantId: string;
            unitPrice: number;
            quantity: number;
          }>;
        }> = [];

        for (const bundleItem of bundleCartItems) {
          const metadata = bundleItem.metadata as BundleCartItemMetadata;
          const variantQuantities =
            this.bundlePricingService.flattenBundleSelections(
              metadata.selections,
              1, // unit quantity for breakdown
            );

          const variantBreakdown = variantQuantities.map((vq) => {
            const pricingResultItem = pricingResult.variantPrices.find(
              (vp) => vp.variantId === vq.variantId,
            );
            return {
              variantId: vq.variantId,
              unitPrice: pricingResultItem?.effectivePrice || vq.quantity,
              quantity: vq.quantity,
            };
          });

          bundlePricingBreakdowns.push({
            bundleId: metadata.bundleId,
            bundleLineId: bundleItem.id,
            unitBundlePrice: bundleItem.price,
            variantBreakdown,
          });
        }

        // Create pricing snapshot
        const rulesetVersion = this.pricingHotReloadWatcher.getCurrentVersion();
        pricingSnapshot = createPricingSnapshot(
          pricingResult,
          activePriceLists,
          rulesetVersion,
          bundlePricingBreakdowns.length > 0
            ? bundlePricingBreakdowns
            : undefined,
        );

        // Log pricing engine run
        try {
          await this.pricingAuditService.logEngineRun(
            checkoutSessionId || "",
            pricingResult,
            rulesetVersion,
          );
        } catch (error) {
          // Log but don't throw - audit logging failure shouldn't break checkout
          this.logger.warn("Failed to log pricing engine run:", error);
        }

        // Log snapshot creation
        try {
          await this.pricingAuditService.logSnapshotCreated(
            checkoutSessionId || "",
            pricingSnapshot,
          );
        } catch (error) {
          // Log but don't throw - audit logging failure shouldn't break checkout
          this.logger.warn("Failed to log pricing snapshot creation:", error);
        }
      } catch (error) {
        // Pricing engine failed, continue with base prices
        this.logger.error("Pricing engine error:", error);
        pricingSnapshot = null;
      }

      // STEP 2: Use discount engine to calculate discount and generate snapshot
      // Discounts apply to effective prices from pricing engine
      let discountAmount = 0;
      let discountSnapshot: DiscountSnapshot | null = null;

      try {
        // Product details already loaded above

        // Fetch collections for products
        const productCollectionData = await db
          .select({
            productId: productCollections.productId,
            collectionId: productCollections.collectionId,
          })
          .from(productCollections)
          .where(inArray(productCollections.productId, productIds));

        const collectionsByProduct = new Map<string, string[]>();
        for (const pc of productCollectionData) {
          if (!collectionsByProduct.has(pc.productId)) {
            collectionsByProduct.set(pc.productId, []);
          }
          collectionsByProduct.get(pc.productId)?.push(pc.collectionId);
        }

        // Fetch tags for products
        const productTagData = await db
          .select({
            productId: productTags.productId,
            tagId: productTags.tagId,
          })
          .from(productTags)
          .where(inArray(productTags.productId, productIds));

        const tagsByProduct = new Map<string, string[]>();
        for (const pt of productTagData) {
          if (!tagsByProduct.has(pt.productId)) {
            tagsByProduct.set(pt.productId, []);
          }
          tagsByProduct.get(pt.productId)?.push(pt.tagId);
        }

        const variantToProduct = new Map(
          variantProductMap.map((v) => [v.variantId, v.productId]),
        );
        const productMap = new Map(productDetails.map((p) => [p.productId, p]));

        // Build cart items for discount engine (variants + flattened bundles)
        const variantItemsForEngine = cartItemsWithVariants.map((item) => {
          const productId = variantToProduct.get(item.productVariantId);
          const product = productId ? productMap.get(productId) : null;
          return {
            id: item.cartItemId,
            productVariantId: item.productVariantId,
            productId: productId || "",
            categoryId: product?.categoryId || null,
            collectionIds: productId
              ? collectionsByProduct.get(productId) || []
              : [],
            tagIds: productId ? tagsByProduct.get(productId) || [] : [],
            price: item.price,
            quantity: item.quantity,
          };
        });

        // Add flattened bundle items to discount engine
        const flattenedBundleItemsForEngine = flattenedBundleVariants.map(
          (v) => {
            const productId = variantToProduct.get(v.variantId);
            const _product = productId ? productMap.get(productId) : null;
            return {
              id: `${v.bundleLineId}-${v.variantId}`, // Unique ID for flattened item
              productVariantId: v.variantId,
              productId: v.productId,
              categoryId: v.categoryId,
              collectionIds: productId
                ? collectionsByProduct.get(productId) || []
                : [],
              tagIds: productId ? tagsByProduct.get(productId) || [] : [],
              price: v.basePrice,
              quantity: v.quantity,
            };
          },
        );

        const cartItemsForEngine = [
          ...variantItemsForEngine,
          ...flattenedBundleItemsForEngine,
        ];

        // Get eligible discounts (use effective subtotal from pricing engine)
        const eligibleDiscounts =
          await this.discountsService.getEligibleDiscounts(
            effectiveSubtotal, // Use effective price from pricing engine
            customerId,
            userId,
            discountCode || undefined,
          );

        if (eligibleDiscounts.length > 0) {
          // Prepare customer data for engine
          const customerData = customerId
            ? {
                id: customerId,
                customerGroupIds: [], // TODO: Parse from customer data if available
              }
            : null;

          // Run discount engine with profiling
          const engineStartTime = Date.now();
          const engineInput: DiscountEngineInput = {
            cart: {
              items: cartItemsForEngine,
            },
            customer: customerData,
            discounts: eligibleDiscounts,
            now: new Date(),
          };

          const engineResult = runDiscountEngine(engineInput);
          const engineRuntime = Date.now() - engineStartTime;
          discountAmount = engineResult.discountTotal;

          // Record profiler metrics
          const rulesetVersion = this.hotReloadWatcher.getCurrentVersion();
          const rulesApplied = engineResult.appliedDiscountIds.length;
          this.discountProfiler.recordEngineRun(
            rulesetVersion,
            engineRuntime,
            rulesApplied,
            true, // Cache hit (using in-memory bundle)
          );

          // Create bundle discount breakdowns
          const bundleDiscountBreakdowns: Array<{
            bundleId: string;
            bundleLineId: string;
            lineDiscountTotal: number;
            variantDiscounts: Array<{
              variantId: string;
              discountAmount: number;
              quantity: number;
            }>;
          }> = [];

          for (const bundleItem of bundleCartItems) {
            const metadata = bundleItem.metadata as BundleCartItemMetadata;
            const variantIds = bundleVariantMapping.get(bundleItem.id) || [];

            // Find discount results for bundle variants
            const variantDiscounts = variantIds.map((variantId) => {
              const lineItem = engineResult.lineItems.find(
                (li) => li.productVariantId === variantId,
              );
              const variantQuantity =
                flattenedBundleVariants.find(
                  (v) =>
                    v.variantId === variantId &&
                    v.bundleLineId === bundleItem.id,
                )?.quantity || 0;

              return {
                variantId,
                discountAmount:
                  lineItem?.discounts.reduce(
                    (sum, d) => sum + d.discountAmount,
                    0,
                  ) || 0,
                quantity: variantQuantity,
              };
            });

            const lineDiscountTotal = variantDiscounts.reduce(
              (sum, vd) => sum + vd.discountAmount * vd.quantity,
              0,
            );

            bundleDiscountBreakdowns.push({
              bundleId: metadata.bundleId,
              bundleLineId: bundleItem.id,
              lineDiscountTotal,
              variantDiscounts,
            });
          }

          // Create snapshot with versioning and integrity metadata
          discountSnapshot = createDiscountSnapshot(
            engineResult,
            eligibleDiscounts,
            rulesetVersion,
            bundleDiscountBreakdowns.length > 0
              ? bundleDiscountBreakdowns
              : undefined,
          );

          // Log discount engine run
          try {
            await this.discountAuditService.logEngineRun(
              cart.id,
              engineResult,
              eligibleDiscounts,
            );
          } catch (error) {
            // Log but don't throw - audit logging failure shouldn't break checkout
            this.logger.warn("Failed to log discount engine run:", error);
          }
        }
      } catch (error) {
        // Discount engine failed, continue without discount
        this.logger.error("Discount engine error:", error);
        discountAmount = 0;
        discountSnapshot = null;
      }

      // Calculate total after discount (discount applies to effective subtotal before GST)
      const subtotalAfterDiscount = Math.max(
        0,
        effectiveSubtotal - discountAmount,
      );
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
        discountSnapshot,
        pricingSnapshot,
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

        // Detect drift during payment intent creation (discounts)
        if (discountSnapshot) {
          await this.driftDetector.detectPaymentIntentDrift(
            checkoutSessionId,
            total,
            amountInPaise / 100, // Convert from paise to rupees
            discountSnapshot,
          );

          // Log snapshot creation
          try {
            await this.discountAuditService.logSnapshotCreated(
              checkoutSessionId,
              discountSnapshot,
            );
          } catch (error) {
            // Log but don't throw - audit logging failure shouldn't break checkout
            this.logger.warn(
              "Failed to log discount snapshot creation:",
              error,
            );
          }
        }

        // Detect pricing drift during payment intent creation
        if (pricingSnapshot) {
          try {
            await this.pricingDriftDetector.detectPaymentIntentDrift(
              checkoutSessionId,
              effectiveSubtotal,
              amountInPaise / 100, // Convert from paise to rupees (total includes GST + shipping)
              pricingSnapshot,
            );
          } catch (error) {
            // Drift detected - block checkout
            this.logger.error("Pricing drift detected:", error);
            throw error;
          }
        }
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

    // Get cart items with metadata
    const cartItemIds = cart.items.map((item) => item.id);
    const allCartItems = await db
      .select({
        id: cartItems.id,
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
        price: cartItems.price,
        metadata: cartItems.metadata,
      })
      .from(cartItems)
      .where(inArray(cartItems.id, cartItemIds));

    if (allCartItems.length === 0) {
      throw new BadRequestException("Cart items not found or invalid");
    }

    // Separate bundle and variant items
    const bundleCartItems: Array<{
      id: string;
      productVariantId: string;
      quantity: number;
      price: number;
      metadata: unknown;
    }> = [];
    const variantCartItems: Array<{
      id: string;
      productVariantId: string;
      quantity: number;
      price: number;
      metadata: unknown;
    }> = [];

    for (const item of allCartItems) {
      const metadata = item.metadata as BundleCartItemMetadata | null;
      if (metadata?.type === "bundle") {
        bundleCartItems.push(item);
      } else {
        variantCartItems.push(item);
      }
    }

    // Get variant items with product details
    const variantItemIds = variantCartItems.map((i) => i.id);
    const cartItemsWithVariantsResult =
      variantItemIds.length > 0
        ? await db
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
            .where(inArray(cartItems.id, variantItemIds))
        : [];

    const cartItemsWithVariants = Array.isArray(cartItemsWithVariantsResult)
      ? cartItemsWithVariantsResult
      : [];

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

    // Use discount snapshot from checkout metadata (don't recalculate)
    // This ensures consistency between payment intent and order creation
    let discountAmount = 0;
    let discountCode: string | null = null;
    if (metadata.discountSnapshot) {
      // Validate snapshot version exists (bundle available)
      if (metadata.discountSnapshot.rulesetVersion) {
        const bundle = await this.bundleService.getBundle(
          metadata.discountSnapshot.rulesetVersion,
        );
        if (!bundle) {
          this.logger.warn(
            `Bundle v${metadata.discountSnapshot.rulesetVersion} not found for snapshot, but continuing with order creation`,
          );
        }
      }

      // Validate snapshot integrity
      // Note: Payment intent amount validation is skipped as amount is not stored in PaymentIntent
      // The snapshot total itself is what was sent to payment provider, so we validate snapshot structure
      const snapshotTotal =
        metadata.discountSnapshot.total + totalGstAmount + shippingCost;

      this.discountSnapshotValidator.validateSnapshot(
        metadata.discountSnapshot,
        [], // Applied discounts not needed for validation (snapshot already contains them)
        snapshotTotal, // Use snapshot total + GST + shipping for validation
      );

      discountAmount = metadata.discountSnapshot.discountTotal;
      // Extract discount code from snapshot (use first applied discount code)
      if (metadata.discountSnapshot.cartDiscounts.length > 0) {
        discountCode = metadata.discountSnapshot.cartDiscounts[0].discountCode;
      } else if (
        metadata.discountSnapshot.lineItems.some(
          (item) => item.discounts.length > 0,
        )
      ) {
        const firstDiscount = metadata.discountSnapshot.lineItems.find(
          (item) => item.discounts.length > 0,
        );
        discountCode = firstDiscount?.discounts[0].discountCode || null;
      }
    } else {
      // Fallback: if snapshot not available, log warning but continue
      this.logger.warn(
        `Discount snapshot not found in checkout metadata for session ${checkoutSessionId}, using 0 discount`,
      );
    }

    // Use effective subtotal from pricing snapshot if available
    let finalSubtotal = subtotal;
    if (metadata.pricingSnapshot) {
      // Validate pricing snapshot
      try {
        this.pricingSnapshotValidator.validate(metadata.pricingSnapshot);
        finalSubtotal = metadata.pricingSnapshot.totalEffectivePrice;
      } catch (_error) {
        this.logger.error(
          `Pricing snapshot validation failed: ${_error instanceof Error ? _error.message : "Unknown error"}`,
        );
        // Continue with base subtotal if snapshot invalid
      }
    }
    const subtotalAfterDiscount = Math.max(0, finalSubtotal - discountAmount);
    const total = subtotalAfterDiscount + totalGstAmount + shippingCost;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order atomically using payment-scoped idempotency
    let orderId: string;
    try {
      // Create order in database with discount snapshot
      const [order] = await db
        .insert(orders)
        .values({
          customerId,
          orderNumber,
          status: "pending",
          subtotal: finalSubtotal, // Use effective subtotal from pricing snapshot
          gstAmount: totalGstAmount,
          discountCode,
          discountAmount,
          shippingCost,
          total,
          shippingAddressId: metadata.shippingAddressId,
          billingAddressId: metadata.billingAddressId,
          razorpayOrderId: paymentIntentId,
          discountSnapshot: metadata.discountSnapshot, // Store full snapshot for refunds/historical accuracy
          pricingSnapshot: metadata.pricingSnapshot, // Store pricing snapshot for refunds/historical accuracy
        })
        .returning();

      orderId = order.id;

      // Log snapshot usage for order creation
      if (metadata.discountSnapshot) {
        try {
          await this.discountAuditService.logSnapshotUsed(
            checkoutSessionId,
            orderId,
            metadata.discountSnapshot,
          );
        } catch (error) {
          // Log but don't throw - audit logging failure shouldn't break order creation
          this.logger.warn("Failed to log discount snapshot usage:", error);
        }
      }

      // Log pricing snapshot usage
      if (metadata.pricingSnapshot) {
        try {
          await this.pricingAuditService.logSnapshotUsed(
            checkoutSessionId,
            orderId,
            metadata.pricingSnapshot,
          );
        } catch (error) {
          // Log but don't throw - audit logging failure shouldn't break order creation
          this.logger.warn("Failed to log pricing snapshot usage:", error);
        }

        // Detect drift during order creation
        try {
          const customerGroupId = await this.getCustomerGroupId(customerId);
          const currentPriceLists =
            await this.getPriceListsForCustomer(customerGroupId);
          const driftResult =
            await this.pricingDriftDetector.detectOrderCreationDrift(
              checkoutSessionId,
              orderId,
              metadata.pricingSnapshot,
              currentPriceLists,
            );

          if (
            driftResult.hasDrift &&
            driftResult.severity === PricingDriftSeverity.CRITICAL
          ) {
            this.logger.error(
              `Critical pricing drift detected: ${JSON.stringify(driftResult.details)}`,
            );
            // Don't throw - order is already created, drift is logged
          }
        } catch (error) {
          // Log but don't throw - drift detection failure shouldn't break order creation
          this.logger.warn("Failed to detect pricing drift:", error);
        }
      }

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

    // Create order items using pricing snapshot prices (if available)
    const orderItemsToInsert: Array<{
      orderId: string;
      productVariantId: string;
      quantity: number;
      price: number;
      gstRate: number;
      gstAmount: number;
      metadata?: unknown;
    }> = [];

    // Create order items for variant items
    for (const item of cartItemsWithVariants) {
      // Use effective price from pricing snapshot if available, otherwise use cart price
      let itemPrice = item.price;
      if (metadata.pricingSnapshot) {
        const variantPrice = metadata.pricingSnapshot.variantPrices.find(
          (vp) => vp.variantId === item.productVariantId,
        );
        if (variantPrice) {
          itemPrice = variantPrice.effectivePrice;
        }
      }

      const itemSubtotal = itemPrice * item.quantity;
      const gstBreakdown = calculateGstBreakdown(
        itemSubtotal,
        item.productGstRate,
        sellerState,
        buyerState,
      );

      orderItemsToInsert.push({
        orderId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        price: itemPrice, // Use effective price from pricing snapshot
        gstRate: item.productGstRate,
        gstAmount: gstBreakdown.totalGst,
      });
    }

    // Expand bundles to multiple order items
    for (const bundleItem of bundleCartItems) {
      const bundleMetadata = bundleItem.metadata as BundleCartItemMetadata;
      const bundleBreakdown =
        metadata.pricingSnapshot?.bundleBreakdowns?.find(
          (b) => b.bundleLineId === bundleItem.id,
        ) ||
        metadata.pricingSnapshot?.bundleBreakdowns?.find(
          (b) => b.bundleId === bundleMetadata.bundleId,
        );

      if (bundleBreakdown) {
        // Use snapshot breakdown
        for (const variantBreakdown of bundleBreakdown.variantBreakdown) {
          // Get variant details for GST
          const [variant] = await db
            .select({
              productId: productVariants.productId,
            })
            .from(productVariants)
            .where(eq(productVariants.id, variantBreakdown.variantId))
            .limit(1);

          if (variant) {
            const [product] = await db
              .select({
                gstRate: products.gstRate,
              })
              .from(products)
              .where(eq(products.id, variant.productId))
              .limit(1);

            if (product) {
              const itemSubtotal =
                variantBreakdown.unitPrice * variantBreakdown.quantity;
              const gstBreakdown = calculateGstBreakdown(
                itemSubtotal,
                product.gstRate,
                sellerState,
                buyerState,
              );

              // Find which set this variant belongs to
              let setId: string | undefined;
              for (const [setIdKey, variantIds] of Object.entries(
                bundleMetadata.selections,
              )) {
                if (variantIds.includes(variantBreakdown.variantId)) {
                  setId = setIdKey;
                  break;
                }
              }

              orderItemsToInsert.push({
                orderId,
                productVariantId: variantBreakdown.variantId,
                quantity: variantBreakdown.quantity,
                price: variantBreakdown.unitPrice,
                gstRate: product.gstRate,
                gstAmount: gstBreakdown.totalGst,
                metadata: {
                  bundleId: bundleMetadata.bundleId,
                  bundleLineId: bundleItem.id,
                  setId,
                  isBundleComponent: true,
                } as unknown as Record<string, unknown>,
              });
            }
          }
        }
      } else {
        // Fallback: flatten bundle manually if snapshot not available
        const variantQuantities =
          this.bundlePricingService.flattenBundleSelections(
            bundleMetadata.selections,
            bundleItem.quantity,
          );

        for (const vq of variantQuantities) {
          const [variant] = await db
            .select({
              productId: productVariants.productId,
            })
            .from(productVariants)
            .where(eq(productVariants.id, vq.variantId))
            .limit(1);

          if (variant) {
            const [product] = await db
              .select({
                gstRate: products.gstRate,
              })
              .from(products)
              .where(eq(products.id, variant.productId))
              .limit(1);

            if (product) {
              // Use unit bundle price divided by variant count
              const unitPrice = bundleItem.price / variantQuantities.length;
              const itemSubtotal = unitPrice * vq.quantity;
              const gstBreakdown = calculateGstBreakdown(
                itemSubtotal,
                product.gstRate,
                sellerState,
                buyerState,
              );

              // Find which set this variant belongs to
              let setId: string | undefined;
              for (const [setIdKey, variantIds] of Object.entries(
                bundleMetadata.selections,
              )) {
                if (variantIds.includes(vq.variantId)) {
                  setId = setIdKey;
                  break;
                }
              }

              orderItemsToInsert.push({
                orderId,
                productVariantId: vq.variantId,
                quantity: vq.quantity,
                price: unitPrice,
                gstRate: product.gstRate,
                gstAmount: gstBreakdown.totalGst,
                metadata: {
                  bundleId: bundleMetadata.bundleId,
                  bundleLineId: bundleItem.id,
                  setId,
                  isBundleComponent: true,
                } as unknown as Record<string, unknown>,
              });
            }
          }
        }
      }
    }

    const insertedOrderItems = await db
      .insert(orderItems)
      .values(orderItemsToInsert)
      .returning();

    // Commit inventory (convert reserved → consumed)
    // This happens AFTER payment confirmation
    try {
      // Release all cart reservations (individual reservation keys)
      await this.inventoryStore.releaseCartReservations(cart.id);

      // Commit reservations for variant items
      for (const item of cartItemsWithVariants) {
        await this.inventoryStore.incrementInventory(
          item.productVariantId,
          -item.quantity,
        );
      }

      // Commit reservations for bundle items (all variants)
      for (const bundleItem of bundleCartItems) {
        const bundleMetadata = bundleItem.metadata as BundleCartItemMetadata;
        const variantQuantities =
          this.bundlePricingService.flattenBundleSelections(
            bundleMetadata.selections,
            bundleItem.quantity,
          );

        for (const vq of variantQuantities) {
          await this.inventoryStore.incrementInventory(
            vq.variantId,
            -vq.quantity,
          );
        }
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
