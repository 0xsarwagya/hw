import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, db, eq, orderItems, orders } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import { OrderResponseDto } from "../dto/order-response.dto";
import { OrderStatus, UpdateOrderStatusDto } from "../dto/update-order-status.dto";
import { OrderGstService } from "./order-gst.service";
import { OrderValidationService } from "./order-validation.service";

/**
 * Service responsible for order status management
 * Handles status transitions and validation
 */
@Injectable()
export class OrderStatusService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
    private readonly validationService: OrderValidationService,
    private readonly gstService: OrderGstService,
  ) {}

  /**
   * Validate status transition
   * Ensures status changes follow a valid workflow
   * @param currentStatus - Current order status
   * @param newStatus - New order status to transition to
   * @throws BadRequestException if transition is invalid
   */
  validateStatusTransition(
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
   * @param userId - User ID
   * @param orderId - Order ID
   * @param updateStatusDto - Status update DTO
   * @returns Updated order with items and GST breakdown
   * @throws NotFoundException if order not found
   * @throws BadRequestException if status transition is invalid
   */
  async updateStatus(
    userId: string,
    orderId: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const customerId = await this.validationService.getCustomerId(userId);

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

    const gstBreakdown = await this.gstService.calculateOrderGstBreakdown(
      orderId,
      updatedOrder.shippingAddressId,
    );

    return {
      ...updatedOrder,
      gstBreakdown,
      items,
    } as OrderResponseDto;
  }
}

