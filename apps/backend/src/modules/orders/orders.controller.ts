import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import { OrderTimelineDto } from "./dto/order-timeline.dto";
import { OrderTrackingDto } from "./dto/order-tracking.dto";
import { PaymentIntentResponseDto } from "./dto/payment-intent-response.dto";
import {
  OrderStatus,
  UpdateOrderStatusDto,
} from "./dto/update-order-status.dto";
import { OrdersService } from "./orders.service";
import { ReconciliationService } from "./reconciliation.service";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  @Post()
  @Public()
  @RateLimit(RATE_LIMIT_PRESETS.PAYMENT_INTENT)
  @ApiOperation({
    summary: "Create payment intent for checkout",
    description:
      "Creates a payment intent for checkout. Supports both authenticated and guest checkout. Orders are created only after payment confirmation via webhook. Returns payment intent and checkout session ID for redirecting to payment gateway.",
  })
  @ApiHeader({
    name: "X-Session-Id",
    description: "Session ID for guest checkout (required for guest checkout)",
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: "Payment intent created successfully",
    type: PaymentIntentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (empty cart, insufficient inventory, etc.)",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized (for authenticated checkout)",
  })
  @ApiResponse({
    status: 404,
    description: "Addresses not found or do not belong to customer",
  })
  @ApiResponse({
    status: 409,
    description:
      "Conflict (cart already being checked out, invalid state, etc.)",
  })
  async create(
    @Request() req: Request & {
      user?: { userId: string; email: string; role: string };
    },
    @Body() createOrderDto: CreateOrderDto,
    @Headers("x-session-id") sessionId?: string,
  ): Promise<PaymentIntentResponseDto> {
    const userId = req.user?.userId || null;
    return this.ordersService.create(userId, createOrderDto, sessionId || null);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all orders for authenticated customer",
    description:
      "Returns all orders for the authenticated customer. Optionally filter by status.",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: OrderStatus,
    description: "Filter orders by status",
    example: "pending",
  })
  @ApiResponse({
    status: 200,
    description: "List of orders",
    type: [OrderResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query("status") status?: OrderStatus,
  ) {
    return this.ordersService.findAll(req.user.userId, status);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get order by ID",
    description:
      "Returns a specific order by ID for the authenticated customer",
  })
  @ApiParam({
    name: "id",
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Order details",
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async findOne(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.ordersService.findOne(req.user.userId, id);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update order status",
    description:
      "Updates the status of an order. Validates status transitions according to order workflow.",
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
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      req.user.userId,
      id,
      updateStatusDto,
    );
  }

  @Get(":id/tracking")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get order tracking information",
    description:
      "Returns tracking information for an order including shipment details and tracking numbers.",
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
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async getTracking(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.ordersService.getTracking(req.user.userId, id);
  }

  @Get(":id/timeline")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get order timeline",
    description:
      "Returns a chronological timeline of all events related to the order including status changes, payments, and shipments.",
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
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  async getTimeline(
    @Request() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.ordersService.getTimeline(req.user.userId, id);
  }

  @Post("reconcile/:paymentIntentId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Reconcile payment intent (admin only)",
    description:
      "Manually reprocess a payment intent to create an order. Safe to call multiple times - idempotent. Use this for recovery after failures.",
  })
  @ApiParam({
    name: "paymentIntentId",
    description: "Payment intent ID from provider (e.g., Razorpay order ID)",
    example: "order_abc123",
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
