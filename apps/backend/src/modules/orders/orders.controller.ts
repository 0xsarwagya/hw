import {
  Body,
  Controller,
  Get,
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
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import { OrderTimelineDto } from "./dto/order-timeline.dto";
import { OrderTrackingDto } from "./dto/order-tracking.dto";
import {
  OrderStatus,
  UpdateOrderStatusDto,
} from "./dto/update-order-status.dto";
import { OrdersService } from "./orders.service";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags("orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: "Create order from cart",
    description:
      "Creates a new order from the customer's cart. Validates addresses, checks inventory, calculates totals, and clears the cart.",
  })
  @ApiResponse({
    status: 201,
    description: "Order created successfully",
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (empty cart, insufficient inventory, etc.)",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    description: "Addresses not found or do not belong to customer",
  })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  @Get()
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
}
