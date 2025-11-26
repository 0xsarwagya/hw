import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
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
    description: "Returns all orders for the authenticated customer",
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
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findAll(req.user.userId);
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
}
