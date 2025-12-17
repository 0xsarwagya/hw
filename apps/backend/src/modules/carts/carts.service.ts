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
import { calculateGstBreakdown } from "../../common/utils/gst.utils";
import { DiscountsService } from "../discounts/discounts.service";
import { runDiscountEngine } from "../discounts/engine/discount-engine";
import { DiscountEngineInput } from "../discounts/engine/discount-engine.types";
import { DiscountAuditService } from "../discounts/services/discount-audit.service";
import { DiscountProfiler } from "../discounts/services/discount-profiler.service";
import { HotReloadWatcher } from "../discounts/services/hot-reload-watcher.service";
import { KEY_PATTERNS } from "../redis-store/constants/key-patterns";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { InventoryStore } from "../redis-store/stores/inventory-store";

@Injectable()
export class CartsService {
  constructor(
    private readonly discountsService: DiscountsService,
    private readonly inventoryStore: InventoryStore,
    private readonly checkoutStore: CheckoutStore,
    private readonly discountAuditService: DiscountAuditService,
    private readonly discountProfiler: DiscountProfiler,
    private readonly hotReloadWatcher: HotReloadWatcher,
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
    // Get all cart items with product prices
    const items = await db
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
      .where(eq(cartItems.cartId, cartId));

    // Calculate subtotal
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Get GST rates from products
    const productIds = [...new Set(items.map((item) => item.productId))];
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

    // Get buyer state
    const buyerState = await this.getBuyerState(customerId);
    const sellerState = this.getSellerState();

    // Calculate GST breakdown per item
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (const item of items) {
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

    const totalGstAmount = totalCgst + totalSgst + totalIgst;

    // Get cart to check for discount code
    const [cart] = await db
      .select({ discountCode: carts.discountCode })
      .from(carts)
      .where(eq(carts.id, cartId))
      .limit(1);

    // Fetch product metadata (collections, tags) for discount engine
    const productDetails = await db
      .select({
        productId: products.id,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(productDetails.map((p) => [p.productId, p]));

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

    // Build cart items with full metadata for discount engine
    const cartItemsForEngine = items.map((item) => {
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

    // Fetch eligible discounts using discount engine
    let discountAmount = 0;
    try {
      const userId = customerId
        ? await this.getUserIdFromCustomerId(customerId)
        : undefined;

      // Extract variant IDs from cart items for eligibility filtering
      const variantIds = items.map((item) => item.productVariantId);

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
          console.warn("Failed to log discount engine run:", error);
        }
      }
    } catch (error) {
      // Discount engine failed, continue without discount
      // Log error but don't break cart recalculation
      console.error("Discount engine error:", error);
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
      items,
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
   * Add item to cart
   */
  async addItem(
    userId: string | null,
    sessionId: string | null,
    addItemDto: { productVariantId: string; quantity: number },
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
    await this.recalculateCartTotals(cart.id);

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
      })
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!item) {
      throw new NotFoundException("Cart item not found");
    }

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
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!item) {
      throw new NotFoundException("Cart item not found");
    }

    // Release reservation before deleting item
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
