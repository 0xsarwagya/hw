import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdminService } from "./admin.service";
import {
  AdminQueryCustomersDto,
  PaginatedCustomersResponseDto,
} from "./dto/admin-customers.dto";
import {
  AdminQueryOrdersDto,
  PaginatedOrdersResponseDto,
} from "./dto/admin-orders.dto";
import {
  AdminQueryProductsDto,
  PaginatedProductsResponseDto,
} from "./dto/admin-products.dto";
import { AdminStatsResponseDto } from "./dto/admin-stats.dto";
import {
  BulkProductOperationDto,
  BulkProductOperationResponseDto,
} from "./dto/bulk-operations.dto";

@ApiTags("admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("products")
  @ApiOperation({
    summary: "Get all products (admin)",
    description:
      "Retrieve a paginated list of all products with search and filters. Admin-only endpoint.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10, max: 100)",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search query (searches in title, description, and SKU)",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["draft", "active", "archived"],
    description: "Filter by status",
  })
  @ApiQuery({
    name: "categoryId",
    required: false,
    type: String,
    description: "Filter by category ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of products retrieved successfully",
    type: PaginatedProductsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getProducts(
    @Query() query: AdminQueryProductsDto,
  ): Promise<PaginatedProductsResponseDto> {
    return this.adminService.getAllProducts(query);
  }

  @Get("orders")
  @ApiOperation({
    summary: "Get all orders (admin)",
    description:
      "Retrieve a paginated list of all orders with filters (status, date range). Admin-only endpoint.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10, max: 100)",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ],
    description: "Filter orders by status",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Filter orders from this date (ISO 8601 format)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "Filter orders until this date (ISO 8601 format)",
  })
  @ApiResponse({
    status: 200,
    description: "List of orders retrieved successfully",
    type: PaginatedOrdersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getOrders(
    @Query() query: AdminQueryOrdersDto,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.adminService.getAllOrders(query);
  }

  @Get("customers")
  @ApiOperation({
    summary: "Get all customers (admin)",
    description:
      "Retrieve a paginated list of all customers with search. Admin-only endpoint.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10, max: 100)",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search query (searches in name, email, phone)",
  })
  @ApiResponse({
    status: 200,
    description: "List of customers retrieved successfully",
    type: PaginatedCustomersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getCustomers(
    @Query() query: AdminQueryCustomersDto,
  ): Promise<PaginatedCustomersResponseDto> {
    return this.adminService.getAllCustomers(query);
  }

  @Get("stats")
  @ApiOperation({
    summary: "Get dashboard statistics (admin)",
    description:
      "Retrieve dashboard statistics including total products, orders, customers, and revenue metrics. Admin-only endpoint.",
  })
  @ApiResponse({
    status: 200,
    description: "Dashboard statistics retrieved successfully",
    type: AdminStatsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getStats(): Promise<AdminStatsResponseDto> {
    return this.adminService.getStats();
  }

  @Post("products/bulk")
  @ApiOperation({
    summary: "Perform bulk operations on products (admin)",
    description:
      "Perform bulk operations (activate, archive, delete) on multiple products. Admin-only endpoint.",
  })
  @ApiResponse({
    status: 200,
    description: "Bulk operation completed successfully",
    type: BulkProductOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid operation or product IDs",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async bulkProductOperation(
    @Body() dto: BulkProductOperationDto,
  ): Promise<BulkProductOperationResponseDto> {
    return this.adminService.bulkProductOperation(dto);
  }
}
