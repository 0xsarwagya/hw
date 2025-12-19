import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../common/constants";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { AdminService } from "./admin.service";
import {
  AdminQueryAbandonedCheckoutsDto,
  PaginatedAbandonedCheckoutsResponseDto,
} from "./dto/admin-abandoned-checkouts.dto";
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
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
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
    description: `Items per page (default: ${DEFAULT_PAGE_SIZE}, max: ${MAX_PAGE_SIZE})`,
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
  @ApiQuery({
    name: "minPrice",
    required: false,
    type: Number,
    description: "Minimum price filter (INR)",
  })
  @ApiQuery({
    name: "maxPrice",
    required: false,
    type: Number,
    description: "Maximum price filter (INR)",
  })
  @ApiQuery({
    name: "inStock",
    required: false,
    type: Boolean,
    description: "Filter by availability (true = in stock, false = out of stock)",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["price", "name", "date"],
    description: "Sort field (default: date)",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    enum: ["asc", "desc"],
    description: "Sort order (default: desc)",
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
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
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
    description: `Items per page (default: ${DEFAULT_PAGE_SIZE}, max: ${MAX_PAGE_SIZE})`,
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
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
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
    description: `Items per page (default: ${DEFAULT_PAGE_SIZE}, max: ${MAX_PAGE_SIZE})`,
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
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
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
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
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

  @Get("abandoned-checkouts")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get abandoned checkouts (admin)",
    description:
      "Retrieve a paginated list of abandoned checkouts (carts with checkout sessions in CREATED or LOCKED state but no orders). Admin-only endpoint.",
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
    description: `Items per page (default: ${DEFAULT_PAGE_SIZE}, max: ${MAX_PAGE_SIZE})`,
  })
  @ApiQuery({
    name: "recoverable",
    required: false,
    type: Boolean,
    description: "Filter by recoverable status (has payment intent)",
  })
  @ApiQuery({
    name: "hasEmail",
    required: false,
    type: Boolean,
    description: "Filter by whether cart has customer email",
  })
  @ApiQuery({
    name: "minValue",
    required: false,
    type: Number,
    description: "Minimum cart value",
  })
  @ApiResponse({
    status: 200,
    description: "List of abandoned checkouts retrieved successfully",
    type: PaginatedAbandonedCheckoutsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getAbandonedCheckouts(
    @Query() query: AdminQueryAbandonedCheckoutsDto,
  ): Promise<PaginatedAbandonedCheckoutsResponseDto> {
    return this.adminService.getAbandonedCheckouts(query);
  }

  @Get("abandoned-checkouts/:cartId")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get abandoned checkout by cart ID (admin)",
    description:
      "Retrieve a single abandoned checkout by cart ID. Admin-only endpoint.",
  })
  @ApiResponse({
    status: 200,
    description: "Abandoned checkout retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Abandoned checkout not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getAbandonedCheckoutByCartId(@Param("cartId") cartId: string) {
    const checkout = await this.adminService.getAbandonedCheckoutByCartId(
      cartId,
    );
    if (!checkout) {
      throw new NotFoundException("Abandoned checkout not found");
    }
    return checkout;
  }
}
