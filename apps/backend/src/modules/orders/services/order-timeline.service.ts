import { Injectable, NotFoundException } from "@nestjs/common";
import { and, db, desc, eq, orders, payments, shipments } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { OrderTimelineDto, TimelineEventDto, TimelineEventType } from "../dto/order-timeline.dto";
import { OrderTrackingDto } from "../dto/order-tracking.dto";
import { OrderValidationService } from "./order-validation.service";

/**
 * Service responsible for order timeline and tracking
 * Handles order event history and shipment tracking
 */
@Injectable()
export class OrderTimelineService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly validationService: OrderValidationService,
  ) {}

  /**
   * Get order tracking information
   * Returns order details with shipment tracking information
   * @param userId - User ID
   * @param orderId - Order ID
   * @returns Order tracking information with shipments
   * @throws NotFoundException if order not found
   */
  async getTracking(
    userId: string,
    orderId: string,
  ): Promise<OrderTrackingDto> {
    const customerId = await this.validationService.getCustomerId(userId);

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
   * @param userId - User ID
   * @param orderId - Order ID
   * @returns Order timeline with all events
   * @throws NotFoundException if order not found
   */
  async getTimeline(
    userId: string,
    orderId: string,
  ): Promise<OrderTimelineDto> {
    const customerId = await this.validationService.getCustomerId(userId);

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

      if (shipment.trackingNumber) {
        events.push({
          type: TimelineEventType.SHIPMENT_TRACKING_UPDATED,
          title: "Tracking Number Assigned",
          description: `Tracking number: ${shipment.trackingNumber}`,
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            awbNumber: shipment.awbNumber,
          },
        });
      }

      if (shipment.status === "delivered") {
        events.push({
          type: TimelineEventType.SHIPMENT_DELIVERED,
          title: "Shipment Delivered",
          description: "Your order has been delivered",
          timestamp: shipment.updatedAt,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
          },
        });
      }
    }

    // Add status change events based on order status
    if (order.status === "confirmed") {
      events.push({
        type: TimelineEventType.ORDER_CONFIRMED,
        title: "Order Confirmed",
        description: "Your order has been confirmed",
        timestamp: order.updatedAt,
        metadata: {
          orderNumber: order.orderNumber,
        },
      });
    } else if (order.status === "processing") {
      events.push({
        type: TimelineEventType.ORDER_PROCESSING,
        title: "Order Processing",
        description: "Your order is being processed",
        timestamp: order.updatedAt,
        metadata: {
          orderNumber: order.orderNumber,
        },
      });
    } else if (order.status === "shipped") {
      events.push({
        type: TimelineEventType.ORDER_SHIPPED,
        title: "Order Shipped",
        description: "Your order has been shipped",
        timestamp: order.updatedAt,
        metadata: {
          orderNumber: order.orderNumber,
        },
      });
    } else if (order.status === "delivered") {
      events.push({
        type: TimelineEventType.ORDER_DELIVERED,
        title: "Order Delivered",
        description: "Your order has been delivered",
        timestamp: order.updatedAt,
        metadata: {
          orderNumber: order.orderNumber,
        },
      });
    } else if (order.status === "cancelled") {
      events.push({
        type: TimelineEventType.ORDER_CANCELLED,
        title: "Order Cancelled",
        description: "Your order has been cancelled",
        timestamp: order.updatedAt,
        metadata: {
          orderNumber: order.orderNumber,
        },
      });
    }

    // Sort events by timestamp (oldest first)
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status as
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded",
      events,
    };
  }
}

