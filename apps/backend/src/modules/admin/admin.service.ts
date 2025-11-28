import { Injectable } from "@nestjs/common";
import {
  addresses,
  and,
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
} from "@vcecom/db";
import { calculateGstBreakdown } from "../../common/utils/gst.utils";
import { ProductsService } from "../products/products.service";
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
  constructor(private readonly productsService: ProductsService) {}

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

    // Get total count
    const countQuery = whereCondition
      ? db.select().from(orders).where(whereCondition)
      : db.select().from(orders);
    const allOrdersForCount = await countQuery;
    const total = allOrdersForCount.length;

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
        };
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
}
