import { Injectable } from "@nestjs/common";
import {
  and,
  categories,
  customers,
  db,
  desc,
  eq,
  gte,
  inArray,
  lte,
  orderItems,
  orders,
  products,
  productVariants,
  refunds,
  reviews,
  shipments,
  sql,
} from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { CustomerSupportDashboardResponseDto } from "../dto/dashboard-customer-support.dto";
import { OperationsDashboardResponseDto } from "../dto/dashboard-operations.dto";
import { OverviewDashboardResponseDto } from "../dto/dashboard-overview.dto";
import { PerformanceDashboardResponseDto } from "../dto/dashboard-performance.dto";
import { ProductMerchandisingDashboardResponseDto } from "../dto/dashboard-product-merchandising.dto";

@Injectable()
export class DashboardService {
  constructor(readonly _logger: PinoLogger) {}

  /**
   * Get Performance Dashboard data
   */
  async getPerformanceDashboard(): Promise<PerformanceDashboardResponseDto> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(now.setDate(now.getDate() - 30));

    // Get all completed orders
    const completedOrders = await db
      .select({
        id: orders.id,
        total: orders.total,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        gstAmount: orders.gstAmount,
        shippingCost: orders.shippingCost,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    // Calculate revenue metrics
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate profit (simplified: revenue - cost, assuming 30% cost margin)
    const estimatedCost = totalRevenue * 0.7; // 70% of revenue is cost
    const totalProfit = totalRevenue - estimatedCost;
    const grossMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const netMargin = grossMargin * 0.9; // Assuming 10% overhead

    // Order volume by period
    const ordersToday = completedOrders.filter(
      (o) => new Date(o.createdAt) >= todayStart,
    ).length;
    const ordersThisWeek = completedOrders.filter(
      (o) => new Date(o.createdAt) >= weekStart,
    ).length;
    const ordersThisMonth = completedOrders.filter(
      (o) => new Date(o.createdAt) >= monthStart,
    ).length;

    // Get refund data
    const refundData = await db
      .select({
        amount: refunds.amount,
        status: refunds.status,
      })
      .from(refunds);

    const totalRefunds = refundData.length;
    const totalRefundAmount = refundData.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );
    const refundRate = totalOrders > 0 ? (totalRefunds / totalOrders) * 100 : 0;

    // Get cancelled orders
    const cancelledOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "cancelled"));
    const cancellationRate =
      totalOrders > 0
        ? (Number(cancelledOrders[0]?.count || 0) / totalOrders) * 100
        : 0;

    // Generate trend data (last 30 days)
    const dailyTrends: Array<{ date: string; value: number }> = [];
    const weeklyTrends: Array<{ date: string; value: number }> = [];
    const monthlyTrends: Array<{ date: string; value: number }> = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRevenue = completedOrders
        .filter(
          (o) =>
            new Date(o.createdAt) >= date && new Date(o.createdAt) < nextDate,
        )
        .reduce((sum, o) => sum + Number(o.total), 0);

      dailyTrends.push({
        date: date.toISOString().split("T")[0],
        value: dayRevenue,
      });
    }

    // Weekly trends (last 12 weeks)
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekRevenue = completedOrders
        .filter(
          (o) =>
            new Date(o.createdAt) >= weekStart &&
            new Date(o.createdAt) < weekEnd,
        )
        .reduce((sum, o) => sum + Number(o.total), 0);

      weeklyTrends.push({
        date: weekStart.toISOString().split("T")[0],
        value: weekRevenue,
      });
    }

    // Monthly trends (last 12 months)
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthRevenue = completedOrders
        .filter(
          (o) =>
            new Date(o.createdAt) >= monthStart &&
            new Date(o.createdAt) < monthEnd,
        )
        .reduce((sum, o) => sum + Number(o.total), 0);

      monthlyTrends.push({
        date: monthStart.toISOString().split("T")[0],
        value: monthRevenue,
      });
    }

    // Traffic sources (simplified - would need analytics integration)
    const trafficSources = [
      {
        source: "Organic",
        visitors: Math.floor(totalOrders * 40),
        revenue: totalRevenue * 0.4,
        conversionRate: 2.5,
      },
      {
        source: "Direct",
        visitors: Math.floor(totalOrders * 30),
        revenue: totalRevenue * 0.3,
        conversionRate: 2.8,
      },
      {
        source: "Social Media",
        visitors: Math.floor(totalOrders * 20),
        revenue: totalRevenue * 0.2,
        conversionRate: 2.0,
      },
      {
        source: "Paid Ads",
        visitors: Math.floor(totalOrders * 10),
        revenue: totalRevenue * 0.1,
        conversionRate: 1.5,
      },
    ];

    // Marketing metrics (simplified - would need marketing data)
    const marketingSpend = totalRevenue * 0.1; // Assume 10% of revenue is marketing
    const cac = totalOrders > 0 ? marketingSpend / totalOrders : 0;
    const roas = marketingSpend > 0 ? (totalRevenue * 0.1) / marketingSpend : 0;

    return {
      revenue: {
        totalRevenue,
        averageOrderValue,
        totalProfit,
        grossMargin,
        netMargin,
      },
      orderVolume: {
        totalOrders,
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
      },
      conversion: {
        conversionRate: 2.5, // Would need analytics integration
        totalVisitors: totalOrders * 40,
        totalSessions: totalOrders * 45,
      },
      marketing: {
        cac,
        roas,
        marketingSpend,
      },
      refunds: {
        refundRate,
        totalRefunds,
        totalRefundAmount,
        cancellationRate,
      },
      dailyTrends,
      weeklyTrends,
      monthlyTrends,
      trafficSources,
    };
  }

  /**
   * Get Operations Dashboard data
   */
  async getOperationsDashboard(): Promise<OperationsDashboardResponseDto> {
    // Get order status counts
    const statusCounts = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.status);

    const statusMap = statusCounts.reduce(
      (acc, s) => {
        acc[s.status] = Number(s.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get delayed orders (orders that are shipped but not delivered after 5 days)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const delayedOrdersData = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(eq(orders.status, "shipped"), lte(orders.createdAt, fiveDaysAgo)),
      )
      .limit(20);

    const delayedOrders = delayedOrdersData.map((order) => {
      const daysDelayed = Math.floor(
        (Date.now() - new Date(order.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const expectedDeliveryDate = new Date(order.createdAt);
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 5);

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        daysDelayed,
        status: order.status,
        expectedDeliveryDate: expectedDeliveryDate.toISOString().split("T")[0],
      };
    });

    // Get RTO data (returned shipments)
    const rtoShipments = await db
      .select({ count: sql<number>`count(*)` })
      .from(shipments)
      .where(eq(shipments.status, "returned"));

    const totalRtoOrders = Number(rtoShipments[0]?.count || 0);
    const totalOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    const rtoRate =
      Number(totalOrders[0]?.count || 0) > 0
        ? (totalRtoOrders / Number(totalOrders[0]?.count || 0)) * 100
        : 0;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const rtoThisMonth = await db
      .select({ count: sql<number>`count(*)` })
      .from(shipments)
      .where(
        and(
          eq(shipments.status, "returned"),
          gte(shipments.createdAt, thisMonthStart),
        ),
      );

    // Inventory aging
    const variants = await db
      .select({
        id: productVariants.id,
        inventory: productVariants.inventory,
        updatedAt: productVariants.updatedAt,
      })
      .from(productVariants);

    const now = new Date();
    const aging = {
      days0to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90Plus: 0,
    };

    variants.forEach((variant) => {
      if (variant.inventory > 0) {
        const daysSinceUpdate = Math.floor(
          (now.getTime() - new Date(variant.updatedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (daysSinceUpdate <= 30) aging.days0to30++;
        else if (daysSinceUpdate <= 60) aging.days31to60++;
        else if (daysSinceUpdate <= 90) aging.days61to90++;
        else aging.days90Plus++;
      }
    });

    // Out of stock alerts
    const outOfStockVariants = await db
      .select({
        productId: productVariants.productId,
        inventory: productVariants.inventory,
        updatedAt: productVariants.updatedAt,
      })
      .from(productVariants)
      .where(eq(productVariants.inventory, 0))
      .limit(20);

    const productIds = outOfStockVariants.map((v) => v.productId);
    const productTitles =
      productIds.length > 0
        ? await db
            .select({
              id: products.id,
              title: products.title,
            })
            .from(products)
            .where(inArray(products.id, productIds))
        : [];

    const titleMap = productTitles.reduce(
      (acc, p) => {
        acc[p.id] = p.title;
        return acc;
      },
      {} as Record<string, string>,
    );

    const outOfStockAlerts = outOfStockVariants.map((variant) => {
      const daysOutOfStock = Math.floor(
        (now.getTime() - new Date(variant.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return {
        productId: variant.productId,
        productTitle: titleMap[variant.productId] || "Unknown Product",
        inventory: variant.inventory,
        daysOutOfStock,
      };
    });

    // Shipping metrics
    const shippedOrders = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        shippingProvider: orders.shippingProvider,
      })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    const shippingTimes: number[] = [];
    const shippingTimesByCourier: Record<string, number[]> = {};

    for (const order of shippedOrders) {
      const shipment = await db
        .select({
          createdAt: shipments.createdAt,
          updatedAt: shipments.updatedAt,
        })
        .from(shipments)
        .where(eq(shipments.orderId, order.id))
        .limit(1);

      if (shipment[0]) {
        const shippingTime =
          (new Date(shipment[0].updatedAt).getTime() -
            new Date(shipment[0].createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        shippingTimes.push(shippingTime);

        if (order.shippingProvider) {
          if (!shippingTimesByCourier[order.shippingProvider]) {
            shippingTimesByCourier[order.shippingProvider] = [];
          }
          shippingTimesByCourier[order.shippingProvider].push(shippingTime);
        }
      }
    }

    const averageShippingTime =
      shippingTimes.length > 0
        ? shippingTimes.reduce((sum, t) => sum + t, 0) / shippingTimes.length
        : 0;

    const averageTimeByCourier: Record<string, number> = {};
    Object.keys(shippingTimesByCourier).forEach((courier) => {
      const times = shippingTimesByCourier[courier];
      averageTimeByCourier[courier] =
        times.length > 0
          ? times.reduce((sum, t) => sum + t, 0) / times.length
          : 0;
    });

    // SLA breaches (assuming 5 day SLA)
    const slaBreaches = delayedOrders.length;
    const slaBreachRate =
      shippedOrders.length > 0 ? (slaBreaches / shippedOrders.length) * 100 : 0;

    return {
      orderStatusCounts: {
        pending: statusMap.pending || 0,
        packed: statusMap.packed || 0,
        shipped: statusMap.shipped || 0,
        delivered: statusMap.delivered || 0,
        cancelled: statusMap.cancelled || 0,
      },
      delayedOrders,
      rto: {
        rtoRate,
        totalRtoOrders,
        rtoThisMonth: Number(rtoThisMonth[0]?.count || 0),
      },
      inventoryAging: aging,
      outOfStockAlerts,
      shipping: {
        averageShippingTime,
        averageTimeByCourier,
        slaBreaches,
        slaBreachRate,
      },
    };
  }

  /**
   * Get Customer & Support Dashboard data
   */
  async getCustomerSupportDashboard(): Promise<CustomerSupportDashboardResponseDto> {
    // Customer segmentation
    const allCustomers = await db.select().from(customers);
    const customerOrders = await db
      .select({
        customerId: orders.customerId,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.customerId);

    const orderCountMap = customerOrders.reduce(
      (acc, co) => {
        acc[co.customerId] = Number(co.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    const newCustomers = allCustomers.filter(
      (c) => !orderCountMap[c.id] || orderCountMap[c.id] === 1,
    ).length;
    const returningCustomers = allCustomers.filter(
      (c) => orderCountMap[c.id] && orderCountMap[c.id] > 1,
    ).length;

    const totalCustomers = allCustomers.length;
    const newCustomerPercentage =
      totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0;
    const returningCustomerPercentage =
      totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Customer retention
    const customersWithMultipleOrders = Object.values(orderCountMap).filter(
      (count) => count > 1,
    ).length;
    const repeatPurchaseRate =
      totalCustomers > 0
        ? (customersWithMultipleOrders / totalCustomers) * 100
        : 0;

    // Calculate CLV (simplified: average order value * average orders per customer)
    const allOrders = await db
      .select({
        total: orders.total,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const averageOrderValue =
      allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
    const averageOrdersPerCustomer =
      totalCustomers > 0 ? allOrders.length / totalCustomers : 0;
    const averageClv = averageOrderValue * averageOrdersPerCustomer;

    // Support metrics (simplified - would need support ticket system)
    const supportMetrics = {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      averageResponseTime: 2.5,
      averageResolutionTime: 24.0,
      firstResponseSla: 85.0,
    };

    // Return reasons (from refunds)
    const refundReasons = await db
      .select({
        reason: refunds.reason,
        count: sql<number>`count(*)`,
      })
      .from(refunds)
      .groupBy(refunds.reason);

    const totalRefunds = refundReasons.reduce(
      (sum, r) => sum + Number(r.count),
      0,
    );

    const returnReasons = refundReasons.map((r) => ({
      reason: r.reason,
      count: Number(r.count),
      percentage: totalRefunds > 0 ? (Number(r.count) / totalRefunds) * 100 : 0,
    }));

    // Complaint trends (simplified - based on refunds per product)
    const productRefunds = await db
      .select({
        productId: products.id,
        productTitle: products.title,
        refundCount: sql<number>`count(*)`,
      })
      .from(refunds)
      .innerJoin(orders, eq(refunds.orderId, orders.id))
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(
        productVariants,
        eq(orderItems.productVariantId, productVariants.id),
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .groupBy(products.id, products.title)
      .limit(10);

    const productOrders = await db
      .select({
        productId: products.id,
        orderCount: sql<number>`count(*)`,
      })
      .from(orderItems)
      .innerJoin(
        productVariants,
        eq(orderItems.productVariantId, productVariants.id),
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .groupBy(products.id);

    const orderCountByProduct = productOrders.reduce(
      (acc, po) => {
        acc[po.productId] = Number(po.orderCount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const complaintTrends = productRefunds.map((pr) => {
      const orderCount = orderCountByProduct[pr.productId] || 1;
      const complaintRate = (Number(pr.refundCount) / orderCount) * 100;
      return {
        productId: pr.productId,
        productTitle: pr.productTitle,
        complaintCount: Number(pr.refundCount),
        complaintRate,
      };
    });

    // Review sentiment
    const reviewData = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.status, "approved"))
      .groupBy(reviews.rating);

    const totalReviews = reviewData.reduce(
      (sum, r) => sum + Number(r.count),
      0,
    );
    const averageRating =
      totalReviews > 0
        ? reviewData.reduce(
            (sum, r) => sum + Number(r.rating) * Number(r.count),
            0,
          ) / totalReviews
        : 0;

    const positiveReviews = reviewData
      .filter((r) => Number(r.rating) >= 4)
      .reduce((sum, r) => sum + Number(r.count), 0);
    const negativeReviews = reviewData
      .filter((r) => Number(r.rating) <= 2)
      .reduce((sum, r) => sum + Number(r.count), 0);
    const neutralReviews = reviewData
      .filter((r) => Number(r.rating) === 3)
      .reduce((sum, r) => sum + Number(r.count), 0);

    // NPS calculation (simplified)
    const nps =
      totalReviews > 0
        ? ((positiveReviews - negativeReviews) / totalReviews) * 100
        : 0;

    return {
      segmentation: {
        newCustomers,
        returningCustomers,
        newCustomerPercentage,
        returningCustomerPercentage,
      },
      retention: {
        repeatPurchaseRate,
        averageClv,
        customersWithMultipleOrders,
      },
      support: supportMetrics,
      returnReasons,
      complaintTrends,
      reviewSentiment: {
        averageRating,
        totalReviews,
        positiveReviews,
        negativeReviews,
        neutralReviews,
        nps,
      },
    };
  }

  /**
   * Get Product & Merchandising Dashboard data
   */
  async getProductMerchandisingDashboard(): Promise<ProductMerchandisingDashboardResponseDto> {
    // Best and worst selling products
    const productSales = await db
      .select({
        productId: products.id,
        productTitle: products.title,
        revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.quantity})`,
        unitsSold: sql<number>`SUM(${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(
        productVariants,
        eq(orderItems.productVariantId, productVariants.id),
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, "delivered"))
      .groupBy(products.id, products.title)
      .orderBy(desc(sql`SUM(${orderItems.price} * ${orderItems.quantity})`));

    const bestSellingProducts = productSales.slice(0, 10).map((ps) => {
      const revenue = Number(ps.revenue);
      const unitsSold = Number(ps.unitsSold);
      const grossMargin = revenue * 0.3; // Assume 30% margin
      return {
        productId: ps.productId,
        productTitle: ps.productTitle,
        revenue,
        unitsSold,
        grossMargin,
        grossMarginPercentage: revenue > 0 ? (grossMargin / revenue) * 100 : 0,
      };
    });

    const worstSellingProducts = productSales
      .slice(-10)
      .reverse()
      .map((ps) => {
        const revenue = Number(ps.revenue);
        const unitsSold = Number(ps.unitsSold);
        const grossMargin = revenue * 0.3;
        return {
          productId: ps.productId,
          productTitle: ps.productTitle,
          revenue,
          unitsSold,
          grossMargin,
          grossMarginPercentage:
            revenue > 0 ? (grossMargin / revenue) * 100 : 0,
        };
      });

    // Category performance
    const categorySales = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.quantity})`,
        unitsSold: sql<number>`SUM(${orderItems.quantity})`,
        productCount: sql<number>`COUNT(DISTINCT ${products.id})`,
      })
      .from(orderItems)
      .innerJoin(
        productVariants,
        eq(orderItems.productVariantId, productVariants.id),
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, "delivered"))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`SUM(${orderItems.price} * ${orderItems.quantity})`));

    const categoryPerformance = categorySales.map((cs) => ({
      categoryId: cs.categoryId || "",
      categoryName: cs.categoryName || "Uncategorized",
      revenue: Number(cs.revenue),
      unitsSold: Number(cs.unitsSold),
      productCount: Number(cs.productCount),
    }));

    // Variant performance
    const variantSales = await db
      .select({
        variantId: productVariants.id,
        productId: products.id,
        size: productVariants.size,
        color: productVariants.color,
        revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.quantity})`,
        unitsSold: sql<number>`SUM(${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(
        productVariants,
        eq(orderItems.productVariantId, productVariants.id),
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, "delivered"))
      .groupBy(
        productVariants.id,
        products.id,
        productVariants.size,
        productVariants.color,
      )
      .orderBy(desc(sql`SUM(${orderItems.price} * ${orderItems.quantity})`))
      .limit(20);

    const topVariants = variantSales.map((vs) => {
      const attributes: Record<string, string> = {};
      if (vs.size) attributes.size = vs.size;
      if (vs.color) attributes.color = vs.color;

      return {
        variantId: vs.variantId,
        productId: vs.productId,
        attributes,
        unitsSold: Number(vs.unitsSold),
        revenue: Number(vs.revenue),
      };
    });

    // Price elasticity (simplified - would need discount data)
    const priceElasticity = bestSellingProducts.slice(0, 5).map((product) => ({
      productId: product.productId,
      productTitle: product.productTitle,
      discountPercentage: 20.0,
      salesIncrease: 45.0,
      revenueImpact: product.revenue * 0.15,
    }));

    // Inventory turnover
    const inventoryData = await db
      .select({
        productId: products.id,
        productTitle: products.title,
        inventory: sql<number>`COALESCE(SUM(${productVariants.inventory}), 0)`,
        unitsSold: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'delivered' THEN ${orderItems.quantity} ELSE 0 END), 0)`,
      })
      .from(products)
      .innerJoin(productVariants, eq(products.id, productVariants.productId))
      .leftJoin(orderItems, eq(productVariants.id, orderItems.productVariantId))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .groupBy(products.id, products.title)
      .limit(20);

    const inventoryTurnover = inventoryData.map((id) => {
      const currentInventory = Number(id.inventory);
      const unitsSold = Number(id.unitsSold) || 1;
      const turnoverRate = unitsSold / (currentInventory + unitsSold);
      const daysToSell =
        currentInventory > 0 ? (currentInventory / unitsSold) * 30 : 0;

      return {
        productId: id.productId,
        productTitle: id.productTitle,
        turnoverRate,
        daysToSell,
        currentInventory,
      };
    });

    // Conversion funnel (simplified - would need analytics)
    const conversionFunnel = {
      views: 10000,
      addToCart: 500,
      purchases: 250,
      viewToCartRate: 5.0,
      cartToPurchaseRate: 50.0,
      overallConversionRate: 2.5,
    };

    return {
      bestSellingProducts,
      worstSellingProducts,
      categoryPerformance,
      topVariants,
      priceElasticity,
      inventoryTurnover,
      conversionFunnel,
    };
  }

  /**
   * Get Overview Dashboard data - aggregated key metrics
   */
  async getOverviewDashboard(): Promise<OverviewDashboardResponseDto> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(now.setDate(now.getDate() - 30));

    // Get all orders
    const allOrders = await db.select().from(orders);
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Monthly revenue
    const monthlyOrders = allOrders.filter(
      (o) => new Date(o.createdAt) >= monthStart,
    );
    const monthlyRevenue = monthlyOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );

    // Orders by period
    const ordersToday = allOrders.filter(
      (o) => new Date(o.createdAt) >= todayStart,
    ).length;
    const ordersThisWeek = allOrders.filter(
      (o) => new Date(o.createdAt) >= weekStart,
    ).length;
    const ordersThisMonth = monthlyOrders.length;

    // Order status counts
    const orderStatusCounts = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.status);

    const statusMap = orderStatusCounts.reduce(
      (acc, s) => {
        acc[s.status] = Number(s.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Customers
    const allCustomers = await db.select().from(customers);
    const totalCustomers = allCustomers.length;
    const newCustomersThisMonth = allCustomers.filter(
      (c) => new Date(c.createdAt) >= monthStart,
    ).length;

    // Products
    const allProducts = await db.select().from(products);
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter(
      (p) => p.status === "active",
    ).length;

    // Out of stock products
    const outOfStockVariants = await db
      .select({
        productId: productVariants.productId,
      })
      .from(productVariants)
      .where(eq(productVariants.inventory, 0));

    const uniqueOutOfStockProducts = new Set(
      outOfStockVariants.map((v) => v.productId),
    ).size;

    // Refunds
    const refundData = await db
      .select({ count: sql<number>`count(*)` })
      .from(refunds);
    const totalRefunds = Number(refundData[0]?.count || 0);
    const refundRate = totalOrders > 0 ? (totalRefunds / totalOrders) * 100 : 0;

    // Reviews
    const reviewData = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.status, "approved"))
      .groupBy(reviews.rating);

    const totalReviews = reviewData.reduce(
      (sum, r) => sum + Number(r.count),
      0,
    );
    const averageRating =
      totalReviews > 0
        ? reviewData.reduce(
            (sum, r) => sum + Number(r.rating) * Number(r.count),
            0,
          ) / totalReviews
        : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      averageOrderValue,
      totalOrders,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      totalCustomers,
      newCustomersThisMonth,
      totalProducts,
      activeProducts,
      pendingOrders: statusMap.pending || 0,
      shippedOrders: statusMap.shipped || 0,
      deliveredOrders: statusMap.delivered || 0,
      outOfStockProducts: uniqueOutOfStockProducts,
      totalRefunds,
      refundRate,
      averageRating,
      totalReviews,
    };
  }
}
