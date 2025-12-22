import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { db, eq, orders, payments } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { isCodPayment } from "../../../common/constants/orders.constants";
import { TimelineEventType } from "../dto/order-timeline.dto";
import { OrderTimelineService } from "./order-timeline.service";

@Injectable()
export class OrderPaymentService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly timelineService: OrderTimelineService,
  ) {}

  /**
   * Mark a COD order as paid
   * @param orderId - Order ID
   * @param adminId - Admin user ID who marked the order as paid
   * @param adminName - Admin name (optional)
   * @param adminEmail - Admin email (optional)
   * @returns Updated order
   */
  async markAsPaid(
    orderId: string,
    adminId: string,
    adminName?: string,
    adminEmail?: string,
  ) {
    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Check if order has a payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!payment) {
      throw new BadRequestException(
        "Order does not have a payment record. Cannot mark as paid.",
      );
    }

    // Verify payment method is COD (case-insensitive)
    if (!isCodPayment(payment.method)) {
      throw new BadRequestException(
        `Order payment method is ${payment.method}, not COD. Only COD orders can be marked as paid manually.`,
      );
    }

    // Check if already paid
    if (payment.status === "captured") {
      throw new BadRequestException("Order is already marked as paid");
    }

    // Update payment status to captured
    await db
      .update(payments)
      .set({
        status: "captured",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Update order status to confirmed if it's still pending (consistent with online payment flow)
    if (order.status === "pending") {
      await db
        .update(orders)
        .set({
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    }

    // Add timeline event
    await this.timelineService.addEvent(orderId, {
      type: TimelineEventType.ORDER_MARKED_PAID,
      title: "Order Marked as Paid",
      description: `COD order marked as paid by admin${adminName ? ` (${adminName})` : ""}`,
      actor: "admin",
      actorId: adminId,
      actorName: adminName,
      actorEmail: adminEmail,
      timestamp: new Date(),
    });

    // Fetch updated order
    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    this.logger.info(
      {
        orderId,
        adminId,
        adminName,
        adminEmail,
        paymentId: payment.id,
        paymentMethod: payment.method,
        previousStatus: payment.status,
        orderStatus: updatedOrder.status,
      },
      "COD order marked as paid by admin",
    );

    return updatedOrder;
  }
}
