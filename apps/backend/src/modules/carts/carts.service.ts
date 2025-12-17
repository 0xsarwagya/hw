import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  addresses,
  and,
  cartItems,
  carts,
  customers,
  db,
  eq,
  inArray,
  productCollections,
  products,
  productTags,
  productVariants,
} from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { calculateGstBreakdown } from "../../common/utils/gst.utils";
import {
  BundleEligibilityService,
  UserBundleSelection,
} from "../bundles/services/bundle-eligibility.service";
import { DiscountsService } from "../discounts/discounts.service";
import { runDiscountEngine } from "../discounts/engine/discount-engine";
import { DiscountEngineInput } from "../discounts/engine/discount-engine.types";
import { DiscountAuditService } from "../discounts/services/discount-audit.service";
import { DiscountProfiler } from "../discounts/services/discount-profiler.service";
import { HotReloadWatcher } from "../discounts/services/hot-reload-watcher.service";
import { BundlePricingService } from "../pricing/services/bundle-pricing.service";
import { KEY_PATTERNS } from "../redis-store/constants/key-patterns";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { InventoryStore } from "../redis-store/stores/inventory-store";
import { BundleCartItemMetadata } from "./dto/bundle-cart-item.dto";

@Injectable()
export class CartsService {
  constructor(
    private readonly discountsService: DiscountsService,
    private readonly inventoryStore: InventoryStore,
    private readonly checkoutStore: CheckoutStore,
    private readonly discountAuditService: DiscountAuditService,
    private readonly discountProfiler: DiscountProfiler,
    private readonly hotReloadWatcher: HotReloadWatcher,
    private readonly bundleEligibilityService: BundleEligibilityService,
    private readonly bundlePricingService: BundlePricingService,
    private readonly logger: PinoLogger,
  ) {}
  private readonly CART_EXPIRY_DAYS = 30; // Cart expires after 30 days

  /**
   * Get or create cart for customer or session
   */
  private async getOrCreateCart(
    customerId: string | null,
    sessionId: string | null,
  ) {
    if (customerId) {
      // Customer cart
      let [cart] = await db
        .select()
        .from(carts)
        .where(eq(carts.customerId, customerId))
        .limit(1);

      if (!cart) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.CART_EXPIRY_DAYS);

        [cart] = await db
          .insert(carts)
          .values({
            customerId,
            expiresAt,
          })
          .returning();
      }

      return cart;
    } else if (sessionId) {
      // Guest cart
      let [cart] = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId))
        .limit(1);

      if (!cart) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.CART_EXPIRY_DAYS);

        [cart] = await db
          .insert(carts)
          .values({
            sessionId,
            expiresAt,
          })
          .returning();
      }

      return cart;
    } else {
      throw new BadRequestException(
        "Either customerId or sessionId must be provided",
      );
    }
  }

  /**
   * Get customer ID from user ID
   */
  private async getCustomerId(userId: string): Promise<string | null> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    return customer?.id || null;
  }

  /**
   * Get seller state (default to Maharashtra for now)
   * TODO: This should come from business configuration
   */
  private getSellerState(): string {
    return process.env.SELLER_STATE || "Maharashtra";
  }

  /**
   * Get buyer state from customer's default address
   */
  private async getBuyerState(
    customerId: string | null,
  ): Promise<string | null> {
    if (!customerId) {
      return null;
    }

    // Get default shipping address
    const [defaultAddress] = await db
      .select({ state: addresses.state })
      .from(addresses)
      .where(
        and(
          eq(addresses.customerId, customerId),
          eq(addresses.isDefault, true),
        ),
      )
      .limit(1);

    return defaultAddress?.state || null;
  }

  /**
   * Recalculate cart totals with proper CGST/SGST/IGST calculation and discounts
   */
  private async recalculateCartTotals(
    cartId: string,
    customerId: string | null = null,
  ) {
    // Get all cart items with metadata
    const items = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        price: cartItems.price,
        productVariantId: cartItems.productVariantId,
        metadata: cartItems.metadata,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));

    // Separate bundle and variant items
    const bundleItems: Array<{
      id: string;
      quantity: number;
      price: number;
      productVariantId: string;
      metadata: unknown;
    }> = [];
    const variantItems: Array<{
      id: string;
      quantity: number;
      price: number;
      productVariantId: string;
      metadata: unknown;
    }> = [];

    for (const item of items) {
      const metadata = item.metadata as BundleCartItemMetadata | null;
      if (metadata?.type === "bundle") {
        bundleItems.push(item);
      } else {
        variantItems.push(item);
      }
    }

    // Get variant items with product info
    const variantItemsWithProducts =
      variantItems.length > 0
        ? await db
            .select({
              id: cartItems.id,
              quantity: cartItems.quantity,
              price: cartItems.price,
              productVariantId: cartItems.productVariantId,
              productId: productVariants.productId,
            })
            .from(cartItems)
            .innerJoin(
              productVariants,
              eq(cartItems.productVariantId, productVariants.id),
            )
            .where(
              inArray(
                cartItems.id,
                variantItems.map((i) => i.id),
              ),
            )
        : [];

    // Calculate subtotal (bundles already have unit price calculated)
    const bundleSubtotal = bundleItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const variantSubtotal = variantItemsWithProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const subtotal = bundleSubtotal + variantSubtotal;

    // Get GST rates from products (for variant items)
    const productIds = [
      ...new Set(variantItemsWithProducts.map((item) => item.productId)),
    ];
    let productGstRates: Array<{ id: string; gstRate: number }> = [];

    if (productIds.length > 0) {
      productGstRates = await db
        .select({
          id: products.id,
          gstRate: products.gstRate,
        })
        .from(products)
        .where(inArray(products.id, productIds));
    }

    const gstRateMap = new Map(productGstRates.map((p) => [p.id, p.gstRate]));

    // For bundles, get GST rates from their component variants
    // Use first variant's product GST rate for simplicity
    const bundleGstRates = new Map<string, number>();
    for (const bundleItem of bundleItems) {
      const _metadata = bundleItem.metadata as BundleCartItemMetadata;
      // Get first variant's product for GST
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
          bundleGstRates.set(bundleItem.id, product.gstRate);
        }
      }
    }

    // Get buyer state
    const buyerState = await this.getBuyerState(customerId);
    const sellerState = this.getSellerState();

    // Calculate GST breakdown per item
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    // Calculate GST for variant items
    for (const item of variantItemsWithProducts) {
      const gstRate = gstRateMap.get(item.productId) || 0;
      const itemAmount = item.price * item.quantity;

      if (gstRate > 0 && buyerState) {
        const breakdown = calculateGstBreakdown(
          itemAmount,
          gstRate,
          sellerState,
          buyerState,
        );
        totalCgst += breakdown.cgst;
        totalSgst += breakdown.sgst;
        totalIgst += breakdown.igst;
      } else if (gstRate > 0) {
        // No buyer state - use IGST (inter-state)
        const breakdown = calculateGstBreakdown(
          itemAmount,
          gstRate,
          sellerState,
          "", // Empty buyer state triggers inter-state
        );
        totalIgst += breakdown.igst;
      }
    }

    // Calculate GST for bundle items
    for (const bundleItem of bundleItems) {
      const gstRate = bundleGstRates.get(bundleItem.id) || 0;
      const itemAmount = bundleItem.price * bundleItem.quantity;

      if (gstRate > 0 && buyerState) {
        const breakdown = calculateGstBreakdown(
          itemAmount,
          gstRate,
          sellerState,
          buyerState,
        );
        totalCgst += breakdown.cgst;
        totalSgst += breakdown.sgst;
        totalIgst += breakdown.igst;
      } else if (gstRate > 0) {
        const breakdown = calculateGstBreakdown(
          itemAmount,
          gstRate,
          sellerState,
          "",
        );
        totalIgst += breakdown.igst;
      }
    }

    const totalGstAmount = totalCgst + totalSgst + totalIgst;

    // Get cart to check for discount code
    const [cart] = await db
      .select({ discountCode: carts.discountCode })
      .from(carts)
      .where(eq(carts.id, cartId))
      .limit(1);

    // Flatten bundles to variant list for discount engine
    const bundleVariantMapping = new Map<string, string[]>(); // bundleLineId -> [variantIds]
    const flattenedBundleItems: Array<{
      id: string;
      productVariantId: string;
      productId: string;
      categoryId: string | null;
      collectionIds: string[];
      tagIds: string[];
      price: number;
      quantity: number;
      bundleLineId?: string; // Track which bundle this belongs to
    }> = [];

    for (const bundleItem of bundleItems) {
      const metadata = bundleItem.metadata as BundleCartItemMetadata;
      const variantQuantities =
        this.bundlePricingService.flattenBundleSelections(
          metadata.selections,
          bundleItem.quantity,
        );

      const bundleVariantIds: string[] = [];
      for (const vq of variantQuantities) {
        // Get variant details
        const [variant] = await db
          .select({
            productId: productVariants.productId,
          })
          .from(productVariants)
          .where(eq(productVariants.id, vq.variantId))
          .limit(1);

        if (variant) {
          bundleVariantIds.push(vq.variantId);
          // Get unit price from bundle breakdown (simplified - use bundle unit price / variant count)
          const unitPrice = bundleItem.price / variantQuantities.length;
          flattenedBundleItems.push({
            id: `${bundleItem.id}-${vq.variantId}`, // Unique ID for flattened item
            productVariantId: vq.variantId,
            productId: variant.productId,
            categoryId: null, // Will be fetched below
            collectionIds: [],
            tagIds: [],
            price: unitPrice,
            quantity: vq.quantity,
            bundleLineId: bundleItem.id,
          });
        }
      }
      bundleVariantMapping.set(bundleItem.id, bundleVariantIds);
    }

    // Get all product IDs (variant items + bundle variants)
    const allVariantIds = [
      ...variantItemsWithProducts.map((i) => i.productVariantId),
      ...flattenedBundleItems.map((i) => i.productVariantId),
    ];

    const allVariants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
      })
      .from(productVariants)
      .where(inArray(productVariants.id, allVariantIds));

    const variantToProduct = new Map(
      allVariants.map((v) => [v.id, v.productId]),
    );

    const allProductIds = [
      ...new Set([
        ...variantItemsWithProducts.map((i) => i.productId),
        ...allVariants.map((v) => v.productId),
      ]),
    ];

    // Fetch product metadata (collections, tags) for discount engine
    const productDetails = await db
      .select({
        productId: products.id,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(inArray(products.id, allProductIds));

    const productMap = new Map(productDetails.map((p) => [p.productId, p]));

    // Fetch collections for products
    const productCollectionData = await db
      .select({
        productId: productCollections.productId,
        collectionId: productCollections.collectionId,
      })
      .from(productCollections)
      .where(inArray(productCollections.productId, allProductIds));

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
      .where(inArray(productTags.productId, allProductIds));

    const tagsByProduct = new Map<string, string[]>();
    for (const pt of productTagData) {
      if (!tagsByProduct.has(pt.productId)) {
        tagsByProduct.set(pt.productId, []);
      }
      tagsByProduct.get(pt.productId)?.push(pt.tagId);
    }

    // Build cart items with full metadata for discount engine (variant items + flattened bundles)
    const variantItemsForEngine = variantItemsWithProducts.map((item) => {
      const product = productMap.get(item.productId);
      return {
        id: item.id,
        productVariantId: item.productVariantId,
        productId: item.productId,
        categoryId: product?.categoryId || null,
        collectionIds: collectionsByProduct.get(item.productId) || [],
        tagIds: tagsByProduct.get(item.productId) || [],
        price: item.price,
        quantity: item.quantity,
      };
    });

    // Enrich flattened bundle items with product metadata
    const enrichedFlattenedBundleItems = flattenedBundleItems.map((item) => {
      const productId = variantToProduct.get(item.productVariantId);
      const product = productId ? productMap.get(productId) : null;
      return {
        ...item,
        productId: productId || "",
        categoryId: product?.categoryId || null,
        collectionIds: productId
          ? collectionsByProduct.get(productId) || []
          : [],
        tagIds: productId ? tagsByProduct.get(productId) || [] : [],
      };
    });

    const cartItemsForEngine = [
      ...variantItemsForEngine,
      ...enrichedFlattenedBundleItems,
    ];

    // Fetch eligible discounts using discount engine
    let discountAmount = 0;
    try {
      const userId = customerId
        ? await this.getUserIdFromCustomerId(customerId)
        : undefined;

      // Extract variant IDs from cart items for eligibility filtering
      const variantIds = cartItemsForEngine.map(
        (item) => item.productVariantId,
      );

      // Get eligible discounts (automatic + manual if code exists)
      // Pass variant IDs for Redis eligibility filtering
      const eligibleDiscounts =
        await this.discountsService.getEligibleDiscounts(
          subtotal,
          customerId,
          userId,
          cart?.discountCode || undefined,
          variantIds, // NEW: pass variant IDs for eligibility filtering
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

        // Log discount engine run
        try {
          await this.discountAuditService.logEngineRun(
            cartId,
            engineResult,
            eligibleDiscounts,
          );
        } catch (error) {
          // Log but don't throw - audit logging failure shouldn't break cart recalculation
          this.logger.warn(
            { cartId, error },
            "Failed to log discount engine run",
          );
        }
      }
    } catch (error) {
      // Discount engine failed, continue without discount
      // Log error but don't break cart recalculation
      this.logger.error({ cartId, error }, "Discount engine error");
      discountAmount = 0;
    }

    // Calculate total after discount (discount applies to subtotal before GST)
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const total = subtotalAfterDiscount + totalGstAmount;

    // Update cart totals
    await db
      .update(carts)
      .set({
        subtotal,
        gstAmount: totalGstAmount,
        discountAmount,
        total,
      })
      .where(eq(carts.id, cartId));

    return {
      subtotal,
      gstAmount: totalGstAmount,
      discountAmount,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      total,
    };
  }

  /**
   * Get user ID from customer ID
   */
  private async getUserIdFromCustomerId(
    customerId: string,
  ): Promise<string | undefined> {
    const [customer] = await db
      .select({ userId: customers.userId })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    return customer?.userId || undefined;
  }

  /**
   * Get cart (for customer or session)
   */
  async getCart(userId: string | null, sessionId: string | null) {
    let customerId: string | null = null;
    if (userId) {
      customerId = await this.getCustomerId(userId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Get cart items
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    // Hydrate bundle items
    const hydratedItems = await Promise.all(
      items.map(async (item) => {
        const metadata = item.metadata as BundleCartItemMetadata | null;
        if (metadata?.type === "bundle") {
          return this.hydrateBundleItem(item, customerId);
        }
        // Variant item - return as-is with type
        return {
          ...item,
          type: "variant" as const,
          price: Number(item.price),
        };
      }),
    );

    // Recalculate totals and get GST breakdown
    const gstBreakdown = await this.recalculateCartTotals(cart.id, customerId);

    // Get updated cart
    const [updatedCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.id, cart.id))
      .limit(1);

    return {
      ...updatedCart,
      discountCode: updatedCart.discountCode,
      discountAmount: Number(updatedCart.discountAmount || 0),
      gstBreakdown: {
        cgst: gstBreakdown.cgst,
        sgst: gstBreakdown.sgst,
        igst: gstBreakdown.igst,
        totalGst: gstBreakdown.gstAmount,
        isIntraState: gstBreakdown.cgst > 0 || gstBreakdown.sgst > 0,
      },
      items: hydratedItems,
    };
  }

  /**
   * Hydrate bundle cart item with full bundle structure
   */
  private async hydrateBundleItem(
    item: {
      id: string;
      productVariantId: string;
      quantity: number;
      price: number;
      metadata: unknown;
      createdAt: Date;
      updatedAt: Date;
    },
    customerId: string | null,
  ) {
    const metadata = item.metadata as BundleCartItemMetadata;
    const bundle = await this.bundleEligibilityService.getBundle(
      metadata.bundleId,
    );

    if (!bundle) {
      throw new NotFoundException(`Bundle ${metadata.bundleId} not found`);
    }

    // Validate bundle is still active
    if (!bundle.isActive) {
      throw new BadRequestException(
        `Bundle ${metadata.bundleId} is no longer active`,
      );
    }

    // Get bundle variant breakdown
    const variantBreakdown =
      await this.bundlePricingService.getBundleVariantBreakdown(
        metadata.bundleId,
        metadata.selections,
        item.quantity,
        customerId,
      );

    return {
      id: item.id,
      type: "bundle" as const,
      productVariantId: item.productVariantId,
      bundleId: metadata.bundleId,
      selections: metadata.selections,
      quantity: item.quantity,
      price: Number(item.price),
      unitBundlePrice: Number(item.price),
      bundleVariantBreakdown: variantBreakdown.map((vb) => ({
        variantId: vb.variantId,
        unitPrice: vb.unitPrice,
        quantity: vb.quantity,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Check if cart has active checkout session (snapshot locked)
   */
  private async isCartSnapshotLocked(cartId: string): Promise<boolean> {
    try {
      // Check if checkout lock exists (indicates payment intent creation started)
      const isLocked = await this.checkoutStore.isCheckoutLocked(cartId);
      if (isLocked) {
        return true;
      }

      // Also check if there's an active checkout session with payment intent
      // This is a best-effort check - we iterate through potential sessions
      // In production, you might want a reverse lookup by cartId
      return false;
    } catch (_error) {
      // If check fails, allow cart update (fail open for availability)
      return false;
    }
  }

  /**
   * Add item to cart (variant or bundle)
   */
  async addItem(
    userId: string | null,
    sessionId: string | null,
    addItemDto: {
      type?: "variant" | "bundle";
      productVariantId?: string;
      bundleId?: string;
      selections?: UserBundleSelection;
      quantity: number;
    },
  ) {
    let customerId: string | null = null;
    if (userId) {
      customerId = await this.getCustomerId(userId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Check if cart has active checkout session (snapshot locked)
    if (await this.isCartSnapshotLocked(cart.id)) {
      throw new ConflictException(
        "Cannot modify cart after payment intent creation. Please start a new checkout.",
      );
    }

    const itemType = addItemDto.type || "variant";

    if (itemType === "bundle") {
      if (!addItemDto.bundleId || !addItemDto.selections) {
        throw new BadRequestException(
          "Bundle ID and selections are required for bundle items",
        );
      }
      return this.addBundleToCart(
        cart.id,
        userId,
        sessionId,
        addItemDto.bundleId,
        addItemDto.selections,
        addItemDto.quantity,
        customerId,
      );
    }

    // Variant item handling (existing logic)
    if (!addItemDto.productVariantId) {
      throw new BadRequestException(
        "Product variant ID is required for variant items",
      );
    }

    // Check if product variant exists and get its price
    const [variant] = await db
      .select({
        id: productVariants.id,
        price: productVariants.price,
        productId: productVariants.productId,
      })
      .from(productVariants)
      .where(eq(productVariants.id, addItemDto.productVariantId))
      .limit(1);

    if (!variant) {
      throw new NotFoundException("Product variant not found");
    }

    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productVariantId, addItemDto.productVariantId),
        ),
      )
      .limit(1);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + addItemDto.quantity;

      // Check available inventory using InventoryStore
      const availableInventory =
        (await this.inventoryStore.getAvailableInventory(
          addItemDto.productVariantId,
        )) ?? 0;
      const reservedInventory = await this.inventoryStore.getReservedInventory(
        addItemDto.productVariantId,
      );
      const available = availableInventory - reservedInventory;

      if (available < newQuantity) {
        throw new BadRequestException(
          `Insufficient inventory. Available: ${available}`,
        );
      }

      // Reserve new quantity (Lua script handles delta automatically)
      await this.inventoryStore.reserveInventory(
        cart.id,
        addItemDto.productVariantId,
        newQuantity,
      );
      // Refresh TTL for the reservation
      await this.inventoryStore.refreshReservationTTL(
        cart.id,
        addItemDto.productVariantId,
      );

      await db
        .update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      // Check available inventory using InventoryStore
      const availableInventory =
        (await this.inventoryStore.getAvailableInventory(
          addItemDto.productVariantId,
        )) ?? 0;
      const reservedInventory = await this.inventoryStore.getReservedInventory(
        addItemDto.productVariantId,
      );
      const available = availableInventory - reservedInventory;

      if (available < addItemDto.quantity) {
        throw new BadRequestException(
          `Insufficient inventory. Available: ${available}`,
        );
      }

      // Reserve inventory
      await this.inventoryStore.reserveInventory(
        cart.id,
        addItemDto.productVariantId,
        addItemDto.quantity,
      );
      // Refresh TTL for the reservation
      await this.inventoryStore.refreshReservationTTL(
        cart.id,
        addItemDto.productVariantId,
      );

      // Create new cart item
      await db.insert(cartItems).values({
        cartId: cart.id,
        productVariantId: addItemDto.productVariantId,
        quantity: addItemDto.quantity,
        price: variant.price,
      });
    }

    // Recalculate totals
    await this.recalculateCartTotals(cart.id, customerId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Add bundle to cart
   */
  private async addBundleToCart(
    cartId: string,
    userId: string | null,
    sessionId: string | null,
    bundleId: string,
    selections: UserBundleSelection,
    bundleQuantity: number,
    customerId: string | null,
  ) {
    // Get bundle from cache/DB
    const bundle = await this.bundleEligibilityService.getBundle(bundleId);
    if (!bundle) {
      throw new NotFoundException(`Bundle with ID ${bundleId} not found`);
    }

    // Validate bundle is active
    if (!bundle.isActive) {
      throw new BadRequestException(`Bundle ${bundleId} is not active`);
    }

    // Validate selections
    const validationResult =
      await this.bundleEligibilityService.validateUserSelection(
        bundleId,
        selections,
      );
    if (!validationResult.isValid) {
      throw new BadRequestException(
        `Invalid bundle selections: ${validationResult.errors.join(", ")}`,
      );
    }

    // Flatten selections to variant quantities
    const variantQuantities = this.bundlePricingService.flattenBundleSelections(
      selections,
      bundleQuantity,
    );

    // Reserve inventory for each variant
    for (const vq of variantQuantities) {
      const availableInventory =
        (await this.inventoryStore.getAvailableInventory(vq.variantId)) ?? 0;
      const reservedInventory = await this.inventoryStore.getReservedInventory(
        vq.variantId,
      );
      const available = availableInventory - reservedInventory;

      if (available < vq.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for variant ${vq.variantId}. Available: ${available}, Required: ${vq.quantity}`,
        );
      }

      // Reserve inventory
      await this.inventoryStore.reserveInventory(
        cartId,
        vq.variantId,
        vq.quantity,
      );
      await this.inventoryStore.refreshReservationTTL(cartId, vq.variantId);
    }

    // Calculate bundle price
    const unitBundlePrice =
      await this.bundlePricingService.calculateBundlePrice(
        bundleId,
        selections,
        1, // unit price
        customerId,
      );

    // Get first variant ID for productVariantId (required by schema)
    const firstVariantId = variantQuantities[0]?.variantId;
    if (!firstVariantId) {
      throw new BadRequestException("Bundle must have at least one variant");
    }

    // Create bundle cart item with metadata
    const metadata: BundleCartItemMetadata = {
      type: "bundle",
      bundleId,
      selections,
      bundleTitle: bundle.title,
    };

    await db.insert(cartItems).values({
      cartId,
      productVariantId: firstVariantId, // Required by schema, but bundle uses metadata
      quantity: bundleQuantity,
      price: unitBundlePrice,
      metadata: metadata as unknown as Record<string, unknown>,
    });

    // Recalculate totals
    await this.recalculateCartTotals(cartId, customerId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Update bundle quantity in cart
   */
  private async updateBundleInCart(
    cartId: string,
    userId: string | null,
    sessionId: string | null,
    itemId: string,
    metadata: BundleCartItemMetadata,
    oldQuantity: number,
    newQuantity: number,
    customerId: string | null,
  ) {
    const delta = newQuantity - oldQuantity;

    if (delta === 0) {
      // No change, just refresh TTLs
      const variantQuantities =
        this.bundlePricingService.flattenBundleSelections(
          metadata.selections,
          newQuantity,
        );
      for (const vq of variantQuantities) {
        await this.inventoryStore.refreshReservationTTL(cartId, vq.variantId);
      }
      return this.getCart(userId, sessionId);
    }

    // Flatten selections to variant quantities for new quantity
    const variantQuantities = this.bundlePricingService.flattenBundleSelections(
      metadata.selections,
      newQuantity,
    );

    // Adjust inventory reservations
    for (const vq of variantQuantities) {
      const availableInventory =
        (await this.inventoryStore.getAvailableInventory(vq.variantId)) ?? 0;
      const reservedInventory = await this.inventoryStore.getReservedInventory(
        vq.variantId,
      );
      const available = availableInventory - reservedInventory;

      if (available < vq.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for variant ${vq.variantId}. Available: ${available}, Required: ${vq.quantity}`,
        );
      }

      // Reserve new quantity (Lua script handles delta automatically)
      await this.inventoryStore.reserveInventory(
        cartId,
        vq.variantId,
        vq.quantity,
      );
      await this.inventoryStore.refreshReservationTTL(cartId, vq.variantId);
    }

    // Recalculate bundle price for new quantity
    const unitBundlePrice =
      await this.bundlePricingService.calculateBundlePrice(
        metadata.bundleId,
        metadata.selections,
        1, // unit price
        customerId,
      );

    // Update cart item
    await db
      .update(cartItems)
      .set({
        quantity: newQuantity,
        price: unitBundlePrice,
      })
      .where(eq(cartItems.id, itemId));

    // Recalculate totals
    await this.recalculateCartTotals(cartId, customerId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    userId: string | null,
    sessionId: string | null,
    itemId: string,
    updateDto: { quantity: number },
  ) {
    let customerId: string | null = null;
    if (userId) {
      customerId = await this.getCustomerId(userId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Check if cart has active checkout session (snapshot locked)
    if (await this.isCartSnapshotLocked(cart.id)) {
      throw new ConflictException(
        "Cannot modify cart after payment intent creation. Please start a new checkout.",
      );
    }

    // Check if item exists and belongs to cart
    const [item] = await db
      .select({
        id: cartItems.id,
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
        metadata: cartItems.metadata,
      })
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!item) {
      throw new NotFoundException("Cart item not found");
    }

    // Check if item is a bundle
    const metadata = item.metadata as BundleCartItemMetadata | null;
    if (metadata?.type === "bundle") {
      return this.updateBundleInCart(
        cart.id,
        userId,
        sessionId,
        itemId,
        metadata,
        item.quantity,
        updateDto.quantity,
        customerId,
      );
    }

    // Variant item handling (existing logic)
    // Calculate quantity delta
    const delta = updateDto.quantity - item.quantity;

    if (delta > 0) {
      // Increasing quantity - check available inventory and reserve additional
      const availableInventory =
        (await this.inventoryStore.getAvailableInventory(
          item.productVariantId,
        )) ?? 0;
      const reservedInventory = await this.inventoryStore.getReservedInventory(
        item.productVariantId,
      );
      const available = availableInventory - reservedInventory;

      if (available < updateDto.quantity) {
        throw new BadRequestException(
          `Insufficient inventory. Available: ${available}`,
        );
      }

      // Reserve new quantity (Lua script handles delta automatically)
      await this.inventoryStore.reserveInventory(
        cart.id,
        item.productVariantId,
        updateDto.quantity,
      );
    } else if (delta < 0) {
      // Decreasing quantity - reserve new quantity (Lua script handles release)
      await this.inventoryStore.reserveInventory(
        cart.id,
        item.productVariantId,
        updateDto.quantity,
      );
    }
    // If delta === 0, refresh TTL only

    // Refresh TTL for the reservation
    await this.inventoryStore.refreshReservationTTL(
      cart.id,
      item.productVariantId,
    );

    // Update quantity
    await db
      .update(cartItems)
      .set({ quantity: updateDto.quantity })
      .where(eq(cartItems.id, itemId));

    // Recalculate totals
    await this.recalculateCartTotals(cart.id, customerId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    userId: string | null,
    sessionId: string | null,
    itemId: string,
  ) {
    let customerId: string | null = null;
    if (userId) {
      customerId = await this.getCustomerId(userId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Check if cart has active checkout session (snapshot locked)
    if (await this.isCartSnapshotLocked(cart.id)) {
      throw new ConflictException(
        "Cannot modify cart after payment intent creation. Please start a new checkout.",
      );
    }

    // Check if item exists and belongs to cart
    const [item] = await db
      .select({
        id: cartItems.id,
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
        metadata: cartItems.metadata,
      })
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!item) {
      throw new NotFoundException("Cart item not found");
    }

    // Check if item is a bundle
    const metadata = item.metadata as BundleCartItemMetadata | null;
    if (metadata?.type === "bundle") {
      // Release reservations for all bundle variants
      const variantQuantities =
        this.bundlePricingService.flattenBundleSelections(
          metadata.selections,
          item.quantity,
        );

      for (const vq of variantQuantities) {
        const reservation = await this.inventoryStore.getReservation(
          cart.id,
          vq.variantId,
        );
        if (reservation !== null && reservation > 0) {
          const reservationKey = KEY_PATTERNS.INVENTORY_RESERVATION(
            cart.id,
            vq.variantId,
          );
          await this.inventoryStore.delete(reservationKey);
          await this.inventoryStore.releaseInventory(vq.variantId, reservation);
        }
      }
    } else {
      // Variant item - release reservation
      const reservation = await this.inventoryStore.getReservation(
        cart.id,
        item.productVariantId,
      );
      if (reservation !== null && reservation > 0) {
        // Delete individual reservation
        const reservationKey = KEY_PATTERNS.INVENTORY_RESERVATION(
          cart.id,
          item.productVariantId,
        );
        await this.inventoryStore.delete(reservationKey);
        // Decrement aggregated reserved count
        await this.inventoryStore.releaseInventory(
          item.productVariantId,
          reservation,
        );
      }
    }

    // Delete item
    await db.delete(cartItems).where(eq(cartItems.id, itemId));

    // Recalculate totals
    await this.recalculateCartTotals(cart.id, customerId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string | null, sessionId: string | null) {
    let customerId: string | null = null;
    if (userId) {
      customerId = await this.getCustomerId(userId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Delete all cart items
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    // Reset cart totals
    await db
      .update(carts)
      .set({
        subtotal: 0,
        gstAmount: 0,
        total: 0,
      })
      .where(eq(carts.id, cart.id));

    return this.getCart(userId, sessionId);
  }

  /**
   * Merge guest cart into customer cart on login
   */
  async mergeGuestCart(userId: string, sessionId: string) {
    const customerId = await this.getCustomerId(userId);
    if (!customerId) {
      throw new NotFoundException("Customer profile not found");
    }

    // Get guest cart
    const [guestCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1);

    if (!guestCart || !guestCart.sessionId) {
      return; // No guest cart to merge
    }

    // Get or create customer cart
    const customerCart = await this.getOrCreateCart(customerId, null);

    // Get guest cart items
    const guestItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));

    // Merge items
    for (const guestItem of guestItems) {
      // Check if item already exists in customer cart
      const [existingItem] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, customerCart.id),
            eq(cartItems.productVariantId, guestItem.productVariantId),
          ),
        )
        .limit(1);

      if (existingItem) {
        // Update quantity (add guest quantity)
        await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + guestItem.quantity })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        // Create new item in customer cart
        await db.insert(cartItems).values({
          cartId: customerCart.id,
          productVariantId: guestItem.productVariantId,
          quantity: guestItem.quantity,
          price: guestItem.price,
        });
      }
    }

    // Delete guest cart
    await db.delete(carts).where(eq(carts.id, guestCart.id));

    // Recalculate customer cart totals
    await this.recalculateCartTotals(customerCart.id, customerId);
  }

  /**
   * Apply discount code to cart
   */
  async applyDiscount(
    userId: string | null,
    sessionId: string | null,
    discountCode: string,
  ) {
    let customerId: string | null = null;
    if (userId) {
      customerId = await this.getCustomerId(userId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Validate discount
    const userIdForValidation = customerId
      ? await this.getUserIdFromCustomerId(customerId)
      : undefined;

    // Get cart subtotal for validation
    const items = await db
      .select({
        price: cartItems.price,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const validation = await this.discountsService.validateDiscount(
      discountCode,
      userIdForValidation,
      subtotal,
    );

    if (!validation.isValid || !validation.discount) {
      throw new BadRequestException(
        validation.error || "Invalid discount code",
      );
    }

    // Apply discount code
    await db.update(carts).set({ discountCode }).where(eq(carts.id, cart.id));

    // Recalculate totals with discount
    await this.recalculateCartTotals(cart.id, customerId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Remove discount code from cart
   */
  async removeDiscount(userId: string | null, sessionId: string | null) {
    let customerId: string | null = null;
    if (userId) {
      customerId = await this.getCustomerId(userId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);

    // Remove discount code
    await db
      .update(carts)
      .set({ discountCode: null, discountAmount: 0 })
      .where(eq(carts.id, cart.id));

    // Recalculate totals without discount
    await this.recalculateCartTotals(cart.id, customerId);

    return this.getCart(userId, sessionId);
  }
}
