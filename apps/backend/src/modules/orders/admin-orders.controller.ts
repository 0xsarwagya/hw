import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { addresses, db, eq, orderItems, orders } from "@vcecom/db";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { calculateGstBreakdown } from "../../common/utils/gst.utils";
import { CreateOrderNoteDto } from "../admin/dto/create-order-note.dto";
import { CreateRefundDto } from "../admin/dto/create-refund.dto";
import { MarkOrderPaidResponseDto } from "../admin/dto/mark-order-paid.dto";
import { OrderNoteResponseDto } from "../admin/dto/order-note-response.dto";
import { RefundResponseDto } from "../admin/dto/refund-response.dto";
import { UpdateOrderAddressDto } from "../admin/dto/update-order-address.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import { OrderTimelineDto } from "./dto/order-timeline.dto";
import { OrderTrackingDto } from "./dto/order-tracking.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { ReconciliationService } from "./reconciliation.service";
import { OrderAddressService } from "./services/order-address.service";
import { OrderNotesService } from "./services/order-notes.service";
import { OrderPaymentService } from "./services/order-payment.service";
import { OrderStatusService } from "./services/order-status.service";
import { OrderTimelineService } from "./services/order-timeline.service";
import { RefundsService } from "./services/refunds.service";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags("admin")
@Controller("admin/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class AdminOrdersController {
  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly orderNotesService: OrderNotesService,
    private readonly refundsService: RefundsService,
    private readonly orderPaymentService: OrderPaymentService,
    private readonly orderAddressService: OrderAddressService,
    private readonly timelineService: OrderTimelineService,
    private readonly statusService: OrderStatusService,
  ) {}

  @Get(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get order by ID (admin)",
    description: "Retrieve a single order by its ID (admin only)",
  })
  @ApiParam({
    name: "id",
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Order retrieved successfully",
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async findOne(@Param("id") id: string): Promise<OrderResponseDto> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
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
      .where(eq(orderItems.orderId, id));

    // Get shipping address for GST calculation
    const [shippingAddress] = await db
      .select({ state: addresses.state })
      .from(addresses)
      .where(eq(addresses.id, order.shippingAddressId))
      .limit(1);

    // Calculate GST breakdown (using Maharashtra as seller state)
    const sellerState = "Maharashtra";
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

  @Get(":id/timeline")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get order timeline (admin)",
    description:
      "Returns a chronological timeline of all events related to the order including status changes, payments, and shipments (admin only).",
  })
  @ApiParam({
    name: "id",
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Order timeline",
    type: OrderTimelineDto,
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async getTimeline(@Param("id") id: string): Promise<OrderTimelineDto> {
    // Admin can access any order, so we pass null as userId
    // The timeline service will need to handle this case
    return this.timelineService.getTimelineForAdmin(id);
  }

  @Get(":id/tracking")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get order tracking information (admin)",
    description:
      "Returns tracking information for an order including shipment details and tracking numbers (admin only).",
  })
  @ApiParam({
    name: "id",
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Order tracking information",
    type: OrderTrackingDto,
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async getTracking(@Param("id") id: string): Promise<OrderTrackingDto> {
    // Admin can access any order, so we pass null as userId
    return this.timelineService.getTrackingForAdmin(id);
  }

  @Patch(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Update order status (admin)",
    description:
      "Updates the status of an order. Validates status transitions according to order workflow (admin only).",
  })
  @ApiParam({
    name: "id",
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Order status updated successfully",
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid status transition",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    // Admin can update any order, so we pass null as userId
    return this.statusService.updateStatusForAdmin(id, updateStatusDto);
  }

  @Post(":id/mark-paid")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Mark COD order as paid (admin)",
    description:
      "Manually mark a Cash on Delivery order as paid. Only works for COD orders that are not already paid.",
  })
  @ApiResponse({
    status: 200,
    description: "Order marked as paid successfully",
    type: MarkOrderPaidResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (not COD, already paid, etc.)",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async markOrderAsPaid(
    @Request() req: AuthenticatedRequest,
    @Param("id") orderId: string,
  ): Promise<MarkOrderPaidResponseDto> {
    return (await this.orderPaymentService.markAsPaid(
      orderId,
      req.user.userId,
      req.user.email.split("@")[0],
      req.user.email,
    )) as unknown as MarkOrderPaidResponseDto;
  }

  @Post(":id/refund")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Create refund for an order (admin)",
    description:
      "Create a refund for an order. Refund will be processed via payment provider if available.",
  })
  @ApiResponse({
    status: 201,
    description: "Refund created successfully",
    type: RefundResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request (invalid amount, exceeds refundable amount, etc.)",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async createRefund(
    @Param("id") orderId: string,
    @Body() createRefundDto: CreateRefundDto,
  ): Promise<RefundResponseDto> {
    return (await this.refundsService.create(
      orderId,
      createRefundDto.amount,
      createRefundDto.reason,
    )) as unknown as RefundResponseDto;
  }

  @Get(":id/refunds")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get all refunds for an order (admin)",
    description: "Retrieve all refunds associated with an order.",
  })
  @ApiResponse({
    status: 200,
    description: "List of refunds retrieved successfully",
    type: [RefundResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async getRefunds(@Param("id") orderId: string): Promise<RefundResponseDto[]> {
    return (await this.refundsService.findByOrderId(
      orderId,
    )) as unknown as RefundResponseDto[];
  }

  @Get(":id/notes")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get all notes for an order (admin)",
    description:
      "Retrieve all notes (both admin and customer-visible) for an order.",
  })
  @ApiResponse({
    status: 200,
    description: "List of notes retrieved successfully",
    type: [OrderNoteResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async getOrderNotes(
    @Param("id") orderId: string,
  ): Promise<OrderNoteResponseDto[]> {
    return (await this.orderNotesService.findByOrderId(
      orderId,
    )) as unknown as OrderNoteResponseDto[];
  }

  @Post(":id/notes")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Create note for an order (admin)",
    description:
      "Add a note to an order. Notes can be admin-only or customer-visible.",
  })
  @ApiResponse({
    status: 201,
    description: "Note created successfully",
    type: OrderNoteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (empty note, etc.)",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async createOrderNote(
    @Request() req: AuthenticatedRequest,
    @Param("id") orderId: string,
    @Body() createNoteDto: CreateOrderNoteDto,
  ): Promise<OrderNoteResponseDto> {
    return (await this.orderNotesService.create(
      orderId,
      createNoteDto.note,
      createNoteDto.isPublic || false,
      req.user.userId,
      req.user.email.split("@")[0],
      req.user.email,
    )) as unknown as OrderNoteResponseDto;
  }

  @Patch(":id/addresses")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Update order address (admin)",
    description:
      "Update shipping or billing address for an order. Validates address fields and PIN code format.",
  })
  @ApiResponse({
    status: 200,
    description: "Address updated successfully",
    type: MarkOrderPaidResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (invalid address fields, PIN code format, etc.)",
  })
  @ApiResponse({
    status: 404,
    description: "Order or address not found",
  })
  async updateOrderAddress(
    @Request() req: AuthenticatedRequest,
    @Param("id") orderId: string,
    @Body() updateAddressDto: UpdateOrderAddressDto,
  ): Promise<MarkOrderPaidResponseDto> {
    return (await this.orderAddressService.updateAddress(
      orderId,
      updateAddressDto.addressType,
      {
        street: updateAddressDto.street,
        city: updateAddressDto.city,
        state: updateAddressDto.state,
        pincode: updateAddressDto.pincode,
        country: updateAddressDto.country,
        district: updateAddressDto.district,
      },
      req.user.userId,
    )) as unknown as MarkOrderPaidResponseDto;
  }

  @Post("reconcile/:paymentIntentId")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Reconcile payment intent (admin only)",
    description:
      "Manually reprocess a payment intent to create an order. Safe to call multiple times - idempotent. Use this for recovery after failures. Admin-only endpoint.",
  })
  @ApiParam({
    name: "paymentIntentId",
    description: "Payment intent ID from provider (e.g., Razorpay order ID)",
    example: "order_abc123",
  })
  @ApiQuery({
    name: "provider",
    description: "Payment provider (default: razorpay)",
    required: false,
    example: "razorpay",
  })
  @ApiResponse({
    status: 200,
    description: "Order created or found",
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (payment not confirmed, invalid state, etc.)",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden (admin role required)",
  })
  @ApiResponse({
    status: 404,
    description: "Payment intent or checkout session not found",
  })
  async reconcile(
    @Param("paymentIntentId") paymentIntentId: string,
    @Query("provider") provider?: string,
  ): Promise<OrderResponseDto | null> {
    return this.reconciliationService.reprocessPaymentIntent(
      paymentIntentId,
      provider || "razorpay",
    );
  }
}
