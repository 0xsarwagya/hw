import { Injectable } from "@nestjs/common";
import {
  addresses,
  and,
  cartItems,
  carts,
  customers,
  db,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  orderItems,
  orders,
  products,
  sql,
} from "@vcecom/db";
import { calculateGstBreakdown } from "../../common/utils/gst.utils";
import { UserBundleSelection } from "../bundles/services/bundle-eligibility.service";
import { CartsService } from "../carts/carts.service";
import { OrderResponseDto } from "../orders/dto/order-response.dto";
import { ProductsService } from "../products/products.service";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import { RedisStoreService } from "../redis-store/redis-store.service";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import {
  AbandonedCheckoutResponse,
  AdminQueryAbandonedCheckoutsDto,
  PaginatedAbandonedCheckoutsResponseDto,
} from "./dto/admin-abandoned-checkouts.dto";
import { AdminQueryCustomersDto } from "./dto/admin-customers.dto";
import { AdminQueryOrdersDto } from "./dto/admin-orders.dto";
import { AdminQueryProductsDto } from "./dto/admin-products.dto";
import { AdminStatsResponseDto } from "./dto/admin-stats.dto";
import {
  BulkProductOperation,
  BulkProductOperationDto,
} from "./dto/bulk-operations.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly productsService: ProductsService,
    readonly _cartsService: CartsService,
    private readonly checkoutStore: CheckoutStore,
    private readonly redisStoreService: RedisStoreService,
  ) {}

  /**
   * Get all products (admin view)
   * Similar to ProductsService.findAll but without public restrictions
   */
  async getAllProducts(query: AdminQueryProductsDto) {
    // Reuse ProductsService logic but ensure admin has access to all products
    return this.productsService.findAll(query);
  }

  /**
   * Get all orders with filters (admin view)
   */
  async getAllOrders(query: AdminQueryOrdersDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: ReturnType<
      typeof eq | typeof and | typeof gte | typeof lte
    >[] = [];

    // Status filter
    if (query.status) {
      conditions.push(eq(orders.status, query.status));
    }

    // Date range filters
    if (query.startDate) {
      conditions.push(gte(orders.createdAt, new Date(query.startDate)));
    }
    if (query.endDate) {
      conditions.push(lte(orders.createdAt, new Date(query.endDate)));
    }

    // Build final where condition
    let whereCondition: ReturnType<typeof and> | undefined;
    if (conditions.length > 0) {
      whereCondition = and(...conditions);
    }

    // Get total count using COUNT(*) for performance
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereCondition || undefined);
    const total = Number(countResult[0]?.count || 0);

    // Get orders with pagination
    const ordersQuery = whereCondition
      ? db.select().from(orders).where(whereCondition)
      : db.select().from(orders);
    const allOrders = await ordersQuery
      .limit(limit)
      .offset(offset)
      .orderBy(desc(orders.createdAt));

    // Get items and GST breakdown for each order
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        // Get shipping address for GST calculation
        const [shippingAddress] = await db
          .select({ state: addresses.state })
          .from(addresses)
          .where(eq(addresses.id, order.shippingAddressId))
          .limit(1);

        // Calculate GST breakdown
        const sellerState = "Maharashtra"; // Assuming seller is in Maharashtra
        const buyerState = shippingAddress?.state || ""; // Handle undefined shippingAddress

        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;

        for (const item of items) {
          const gstBreakdown = calculateGstBreakdown(
            item.price * item.quantity,
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
          paymentFeeBreakdown: order.paymentFeeBreakdown as
            | {
                method: string;
                chargeType: string;
                calculatedFee: number;
                flatAmount?: number;
                percentage?: number;
                mixMin?: number;
                mixCap?: number;
              }
            | null
            | undefined,
        } as OrderResponseDto;
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: ordersWithItems,
      total: Number(total),
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get all customers with search (admin view)
   */
  async getAllCustomers(query: AdminQueryCustomersDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: ReturnType<typeof or | typeof ilike>[] = [];

    // Search condition (name, email, or phone)
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const searchCondition = or(
        ilike(customers.name, searchPattern),
        ilike(customers.email, searchPattern),
        ilike(customers.phone, searchPattern),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Build final where condition
    let whereCondition: ReturnType<typeof and> | undefined;
    if (conditions.length > 0) {
      whereCondition = and(...conditions);
    }

    // Get total count
    const countQuery = whereCondition
      ? db.select().from(customers).where(whereCondition)
      : db.select().from(customers);
    const allCustomersForCount = await countQuery;
    const total = allCustomersForCount.length;

    // Get customers with pagination
    const customersQuery = whereCondition
      ? db.select().from(customers).where(whereCondition)
      : db.select().from(customers);
    const allCustomers = await customersQuery
      .limit(limit)
      .offset(offset)
      .orderBy(desc(customers.createdAt));

    const totalPages = Math.ceil(total / limit);

    return {
      data: allCustomers,
      total: Number(total),
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<AdminStatsResponseDto> {
    // Get total products
    const allProducts = await db.select().from(products);
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter(
      (p) => p.status === "active",
    ).length;

    // Get total orders
    const allOrders = await db.select().from(orders);
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(
      (o) => o.status === "pending",
    ).length;

    // Calculate total revenue
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);

    // Calculate monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = allOrders.filter(
      (o) => new Date(o.createdAt) >= startOfMonth,
    );
    const monthlyRevenue = monthlyOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get total customers
    const allCustomers = await db.select().from(customers);
    const totalCustomers = allCustomers.length;

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalRevenue,
      monthlyRevenue,
      averageOrderValue,
    };
  }

  /**
   * Perform bulk operations on products
   */
  async bulkProductOperation(
    dto: BulkProductOperationDto,
  ): Promise<{ affected: number; operation: string; message: string }> {
    const { productIds, operation } = dto;

    // Verify products exist
    const existingProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    if (existingProducts.length !== productIds.length) {
      throw new Error("Some products not found");
    }

    let affected = 0;

    switch (operation) {
      case BulkProductOperation.ACTIVATE:
        await db
          .update(products)
          .set({ status: "active", updatedAt: new Date() })
          .where(inArray(products.id, productIds));
        affected = productIds.length;
        break;

      case BulkProductOperation.ARCHIVE:
        await db
          .update(products)
          .set({ status: "archived", updatedAt: new Date() })
          .where(inArray(products.id, productIds));
        affected = productIds.length;
        break;

      case BulkProductOperation.DELETE:
        // Note: In production, you might want to soft delete instead
        await db.delete(products).where(inArray(products.id, productIds));
        affected = productIds.length;
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return {
      affected,
      operation,
      message: `Successfully ${operation}d ${affected} product(s)`,
    };
  }

  /**
   * Get abandoned checkouts (carts with checkout sessions in CREATED or LOCKED state but no orders)
   */
  async getAbandonedCheckouts(
    query: AdminQueryAbandonedCheckoutsDto,
  ): Promise<PaginatedAbandonedCheckoutsResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    // Get Redis client to scan for checkout sessions
    const redisClient = await this.redisStoreService.getClient();

    // Scan for all checkout session keys
    const sessionKeys: string[] = [];
    let cursor = "0";

    do {
      const result = await redisClient.scan(
        cursor,
        "MATCH",
        "checkout:session:*",
        "COUNT",
        100,
      );
      cursor = result[0];
      sessionKeys.push(...result[1]);
    } while (cursor !== "0");

    // Get all sessions and filter by CREATED or LOCKED state
    const abandonedSessions: Array<{
      sessionId: string;
      cartId: string;
      paymentIntentId: string | null;
      checkoutState: CheckoutState;
    }> = [];

    for (const key of sessionKeys) {
      try {
        const session = await this.checkoutStore.getSession(
          key.replace("checkout:session:", ""),
        );
        if (
          session &&
          (session.state === CheckoutState.CREATED ||
            session.state === CheckoutState.LOCKED) &&
          !session.orderId // Only include sessions without orders
        ) {
          abandonedSessions.push({
            sessionId: key.replace("checkout:session:", ""),
            cartId: session.cartId,
            paymentIntentId: session.paymentIntentId,
            checkoutState: session.state,
          });
        }
      } catch (_error) {}
    }

    // Get unique cart IDs
    const cartIds = Array.from(new Set(abandonedSessions.map((s) => s.cartId)));

    if (cartIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Get carts from database
    const allCarts = await db
      .select()
      .from(carts)
      .where(inArray(carts.id, cartIds));

    // Build abandoned checkouts with cart data
    const abandonedCheckouts: AbandonedCheckoutResponse[] = [];

    for (const session of abandonedSessions) {
      const cart = allCarts.find((c) => c.id === session.cartId);
      if (!cart) continue;

      // Get cart items
      const cartItemsData = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cart.id));

      // Get customer email if exists
      let customerEmail: string | null = null;
      if (cart.customerId) {
        const [customer] = await db
          .select({ email: customers.email })
          .from(customers)
          .where(eq(customers.id, cart.customerId))
          .limit(1);
        customerEmail = customer?.email || null;
      }

      // Apply filters
      if (query.recoverable !== undefined) {
        const hasPaymentIntent = !!session.paymentIntentId;
        if (query.recoverable !== hasPaymentIntent) continue;
      }

      if (query.hasEmail !== undefined) {
        const hasEmail = !!customerEmail;
        if (query.hasEmail !== hasEmail) continue;
      }

      if (query.minValue !== undefined) {
        if (cart.total < query.minValue) continue;
      }

      // Calculate GST breakdown (simplified - using cart's shipping address if available)
      const gstBreakdown = {
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalGst: cart.gstAmount,
        isIntraState: true, // Simplified
      };

      abandonedCheckouts.push({
        id: session.sessionId,
        cartId: cart.id,
        customerId: cart.customerId,
        sessionId: cart.sessionId,
        checkoutState: session.checkoutState as "CREATED" | "LOCKED",
        subtotal: cart.subtotal,
        gstAmount: cart.gstAmount,
        discountCode: cart.discountCode,
        discountAmount: cart.discountAmount,
        gstBreakdown,
        total: cart.total,
        items: cartItemsData.map((item) => {
          const metadata = item.metadata as {
            type?: "variant" | "bundle";
            bundleId?: string;
            selections?: UserBundleSelection;
          };
          return {
            id: item.id,
            type: (metadata?.type || "variant") as "variant" | "bundle",
            productVariantId: item.productVariantId,
            bundleId: metadata?.bundleId,
            selections: metadata?.selections,
            quantity: item.quantity,
            price: item.price,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        }),
        paymentIntentId: session.paymentIntentId,
        customerEmail,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        expiresAt: cart.expiresAt,
      });
    }

    // Sort by createdAt descending
    abandonedCheckouts.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    // Paginate
    const total = abandonedCheckouts.length;
    const offset = (page - 1) * limit;
    const paginatedData = abandonedCheckouts.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get abandoned checkout by cart ID
   */
  async getAbandonedCheckoutByCartId(
    cartId: string,
  ): Promise<AbandonedCheckoutResponse | null> {
    // Get Redis client to scan for checkout sessions
    const redisClient = await this.redisStoreService.getClient();

    // Scan for checkout session keys
    const sessionKeys: string[] = [];
    let cursor = "0";

    do {
      const result = await redisClient.scan(
        cursor,
        "MATCH",
        "checkout:session:*",
        "COUNT",
        100,
      );
      cursor = result[0];
      sessionKeys.push(...result[1]);
    } while (cursor !== "0");

    // Find session for this cart
    let sessionData: {
      sessionId: string;
      cartId: string;
      paymentIntentId: string | null;
      checkoutState: CheckoutState;
    } | null = null;

    for (const key of sessionKeys) {
      try {
        const session = await this.checkoutStore.getSession(
          key.replace("checkout:session:", ""),
        );
        if (
          session &&
          session.cartId === cartId &&
          (session.state === CheckoutState.CREATED ||
            session.state === CheckoutState.LOCKED) &&
          !session.orderId
        ) {
          sessionData = {
            sessionId: key.replace("checkout:session:", ""),
            cartId: session.cartId,
            paymentIntentId: session.paymentIntentId,
            checkoutState: session.state,
          };
          break;
        }
      } catch (_error) {}
    }

    if (!sessionData) {
      return null;
    }

    // Get cart from database
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.id, cartId))
      .limit(1);

    if (!cart) {
      return null;
    }

    // Get cart items
    const cartItemsData = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    // Get customer email if exists
    let customerEmail: string | null = null;
    if (cart.customerId) {
      const [customer] = await db
        .select({ email: customers.email })
        .from(customers)
        .where(eq(customers.id, cart.customerId))
        .limit(1);
      customerEmail = customer?.email || null;
    }

    // Calculate GST breakdown
    const gstBreakdown = {
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGst: cart.gstAmount,
      isIntraState: true,
    };

    return {
      id: sessionData.sessionId,
      cartId: cart.id,
      customerId: cart.customerId,
      sessionId: cart.sessionId,
      checkoutState: sessionData.checkoutState as "CREATED" | "LOCKED",
      subtotal: cart.subtotal,
      gstAmount: cart.gstAmount,
      discountCode: cart.discountCode,
      discountAmount: cart.discountAmount,
      gstBreakdown,
      total: cart.total,
      items: cartItemsData.map((item) => {
        const metadata = item.metadata as {
          type?: "variant" | "bundle";
          bundleId?: string;
          selections?: UserBundleSelection;
        };
        return {
          id: item.id,
          type: (metadata?.type || "variant") as "variant" | "bundle",
          productVariantId: item.productVariantId,
          bundleId: metadata?.bundleId,
          selections: metadata?.selections,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }),
      paymentIntentId: sessionData.paymentIntentId,
      customerEmail,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      expiresAt: cart.expiresAt,
    };
  }
}
